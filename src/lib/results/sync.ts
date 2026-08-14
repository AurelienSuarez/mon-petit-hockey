// No "server-only" guard here (unlike most of this app's server code): this module is
// also imported by custom-worker.ts, which Wrangler bundles directly — outside Next's
// webpack graph, where the server-only package's client/server aliasing doesn't apply
// and it throws unconditionally on import.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchCompletedFihMatches, type FihCompletedMatch } from "./fih-feed";
import { finalizeMatchResult } from "./finalize-match";

export interface SyncOutcome {
  applied: string[];
  skipped: { gameId: string; reason: string }[];
}

/**
 * Applies every FIH-reported finished match to this app's DB. Runs in a loop, one
 * match at a time and re-reading `matches` before each — deliberately not
 * parallelized, because finalizeMatchResult() resolves bracket slots as it goes, and a
 * later-round match's teams may only become known once an earlier one in this same
 * batch has been applied.
 */
export async function syncFihResults(db: SupabaseClient<Database>): Promise<SyncOutcome> {
  const outcome: SyncOutcome = { applied: [], skipped: [] };

  let fihMatches: FihCompletedMatch[];
  try {
    fihMatches = await fetchCompletedFihMatches();
  } catch (err) {
    outcome.skipped.push({ gameId: "*", reason: `fih_feed_fetch_failed: ${(err as Error).message}` });
    return outcome;
  }

  for (const fm of fihMatches) {
    const { data: teams } = await db.from("teams").select("id, name").eq("gender", fm.gender);
    const teamIdByName = new Map((teams ?? []).map((t) => [t.name, t.id]));
    const homeTeamId = teamIdByName.get(fm.homeTeamName);
    const awayTeamId = teamIdByName.get(fm.awayTeamName);
    if (!homeTeamId || !awayTeamId) {
      outcome.skipped.push({ gameId: fm.gameId, reason: `unknown_team: ${fm.homeTeamName}/${fm.awayTeamName}` });
      continue;
    }

    const { data: candidates } = await db
      .from("matches")
      .select("id, home_team_id, away_team_id")
      .eq("gender", fm.gender)
      .eq("status", "scheduled")
      .in("home_team_id", [homeTeamId, awayTeamId])
      .in("away_team_id", [homeTeamId, awayTeamId]);

    if (!candidates || candidates.length === 0) {
      // Not an error: most polls see nothing new, or the match was already entered
      // manually via the admin page and is no longer 'scheduled'.
      continue;
    }
    if (candidates.length > 1) {
      outcome.skipped.push({ gameId: fm.gameId, reason: "ambiguous_match_multiple_candidates" });
      continue;
    }

    const match = candidates[0];
    // FIH's home/away designation doesn't necessarily line up with this app's — match
    // by the unordered team pair above, then orient the scores to whichever side is
    // actually home_team_id here.
    const oriented =
      match.home_team_id === homeTeamId
        ? { homeScore: fm.homeScore, awayScore: fm.awayScore, homeSoScore: fm.homeSoScore, awaySoScore: fm.awaySoScore }
        : { homeScore: fm.awayScore, awayScore: fm.homeScore, homeSoScore: fm.awaySoScore, awaySoScore: fm.homeSoScore };

    const result = await finalizeMatchResult(db, { matchId: match.id, ...oriented });
    if (!result.ok) {
      // shootout_scores_required means FIH hasn't given us usable shoot-out data for a
      // knockout draw — leave it for the admin page rather than guessing.
      outcome.skipped.push({ gameId: fm.gameId, reason: result.error });
      continue;
    }
    outcome.applied.push(fm.gameId);
  }

  return outcome;
}
