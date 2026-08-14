// No "server-only" guard (see sync.ts) — this is also reachable from custom-worker.ts.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { computePoints, regulationOutcome, type MatchResult } from "@/lib/scoring/points";
import {
  applyOverround,
  computeMatchOdds,
  DEFAULT_OVERROUND_TARGET,
  expectedGoals,
  outcomeProbabilities,
  poissonPmf,
  probabilitiesToDecimalOdds,
  updateElo,
} from "@/lib/odds/engine";
import { resolvePendingMatches, type ResolvableMatch } from "@/lib/tournament/resolve";
import { KNOCKOUT_STAGES, type Venue } from "@/lib/types";

export interface FinalizeMatchInput {
  matchId: string;
  homeScore: number;
  awayScore: number;
  homeSoScore?: number | null;
  awaySoScore?: number | null;
}

export type FinalizeMatchResult =
  | { ok: true; slotsResolved: number; oddsRefreshed: number }
  | { ok: false; error: string };

/** Which side, if either, is the host nation playing on its own site. */
function crowdAdvantageFor(
  venue: Venue,
  homeName: string,
  awayName: string,
): "home" | "away" | null {
  const hostTeam = venue === "wavre" ? "Belgique" : venue === "amstelveen" ? "Pays-Bas" : null;
  if (!hostTeam) return null;
  if (homeName === hostTeam) return "home";
  if (awayName === hostTeam) return "away";
  return null;
}

/**
 * Records a final result and cascades every downstream effect: scores predictions,
 * updates Elo, resolves any round1/crossgroup/knockout slots this result unblocks,
 * and refreshes odds for every still-open match. Not wrapped in a single DB
 * transaction (Supabase's JS client can't span one across these steps) — acceptable
 * for a friend-group pool, but a crash mid-way could leave a partially-applied
 * update. Re-running the whole flow isn't safe (Elo would be double-applied), which
 * is why this refuses to touch a match that's already 'finished'.
 *
 * Shared by the admin entry-form route and the automated FIH results sync — both
 * already hold a service-role client and have independently verified the write is
 * legitimate (admin auth check, or the sync job's own trust boundary) before calling in.
 */
export async function finalizeMatchResult(
  db: SupabaseClient<Database>,
  input: FinalizeMatchInput,
): Promise<FinalizeMatchResult> {
  const { matchId, homeScore, awayScore, homeSoScore, awaySoScore } = input;

  const { data: match, error: matchError } = await db.from("matches").select("*").eq("id", matchId).single();
  if (matchError || !match) return { ok: false, error: "match_not_found" };

  if (match.status === "finished") return { ok: false, error: "already_finished" };
  if (!match.home_team_id || !match.away_team_id) return { ok: false, error: "teams_not_resolved" };

  const isKnockout = KNOCKOUT_STAGES.includes(match.stage);
  const isTie = homeScore === awayScore;
  if (isKnockout && isTie && (homeSoScore == null || awaySoScore == null || homeSoScore === awaySoScore)) {
    return { ok: false, error: "shootout_scores_required" };
  }

  const { data: teams, error: teamsError } = await db.from("teams").select("id, name");
  if (teamsError) return { ok: false, error: teamsError.message };
  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const homeName = teamNameById.get(match.home_team_id) ?? "";
  const awayName = teamNameById.get(match.away_team_id) ?? "";
  const crowdAdvantage = crowdAdvantageFor(match.venue, homeName, awayName);

  // Elo as of right now — i.e. as of just before this result is applied. Used both as
  // the fallback for predictions made before locked_home_elo/away_elo existed, and as
  // the base for this match's own Elo update below.
  const { data: ratings, error: ratingsError } = await db
    .from("team_ratings")
    .select("team_id, elo")
    .in("team_id", [match.home_team_id, match.away_team_id]);
  if (ratingsError) return { ok: false, error: ratingsError.message };
  const eloByTeamId = new Map((ratings ?? []).map((r) => [r.team_id, r.elo]));
  const currentHomeElo = eloByTeamId.get(match.home_team_id) ?? 1500;
  const currentAwayElo = eloByTeamId.get(match.away_team_id) ?? 1500;

  // 1. Record the result.
  const { error: updateMatchError } = await db
    .from("matches")
    .update({
      status: "finished",
      home_score: homeScore,
      away_score: awayScore,
      home_so_score: isKnockout && isTie ? homeSoScore : null,
      away_so_score: isKnockout && isTie ? awaySoScore : null,
    })
    .eq("id", matchId);
  if (updateMatchError) return { ok: false, error: updateMatchError.message };

  // 2. Score every prediction made for this match, priced off the odds/exact-score
  // probability implied by the Elo each user's prediction was locked in against — not
  // today's Elo, which may have moved since (see 20260813000003_odds_scoring.sql).
  const wentToShootout = isKnockout && isTie;
  const shootoutWinner: "home" | "away" | null = wentToShootout
    ? (homeSoScore as number) > (awaySoScore as number)
      ? "home"
      : "away"
    : null;
  const matchResult: MatchResult = { homeScore, awayScore, wentToShootout, shootoutWinner };

  const { data: predictions, error: predictionsError } = await db
    .from("predictions")
    .select("id, pred_home_score, pred_away_score, pred_shootout_winner, locked_home_elo, locked_away_elo")
    .eq("match_id", matchId);
  if (predictionsError) return { ok: false, error: predictionsError.message };

  await Promise.all(
    (predictions ?? []).map((p) => {
      const lockedHomeElo = p.locked_home_elo ?? currentHomeElo;
      const lockedAwayElo = p.locked_away_elo ?? currentAwayElo;

      const lambda = expectedGoals({ homeElo: lockedHomeElo, awayElo: lockedAwayElo, crowdAdvantage });
      const fairProbs = outcomeProbabilities(lambda.home, lambda.away);
      // Always a 3-way market for scoring purposes, even for a knockout-stage match
      // (whose *displayed* odds are 2-way) — a prediction can still be a regulation
      // draw there, and needs a price to be scored against.
      const [homeOdds, drawOdds, awayOdds] = probabilitiesToDecimalOdds(
        applyOverround([fairProbs.home, fairProbs.draw, fairProbs.away], DEFAULT_OVERROUND_TARGET),
      );

      const prediction = {
        homeScore: p.pred_home_score,
        awayScore: p.pred_away_score,
        shootoutWinner: p.pred_shootout_winner,
      };
      const predictedOutcomeOdds =
        regulationOutcome(prediction) === "home" ? homeOdds : regulationOutcome(prediction) === "away" ? awayOdds : drawOdds;
      const exactScoreProbability =
        poissonPmf(p.pred_home_score, lambda.home) * poissonPmf(p.pred_away_score, lambda.away);

      const points = computePoints(prediction, matchResult, predictedOutcomeOdds, exactScoreProbability);
      return db.from("predictions").update({ points }).eq("id", p.id);
    }),
  );

  // 3. Update Elo for both teams.
  const { homeElo, awayElo } = updateElo({
    homeElo: currentHomeElo,
    awayElo: currentAwayElo,
    homeGoals: homeScore,
    awayGoals: awayScore,
    stage: match.stage,
  });
  eloByTeamId.set(match.home_team_id, homeElo);
  eloByTeamId.set(match.away_team_id, awayElo);

  const nowIso = new Date().toISOString();
  await Promise.all([
    db.from("team_ratings").update({ elo: homeElo, updated_at: nowIso }).eq("team_id", match.home_team_id),
    db.from("team_ratings").update({ elo: awayElo, updated_at: nowIso }).eq("team_id", match.away_team_id),
  ]);

  // 4. Resolve any slots this result unblocks (crossgroup pools, semifinal outcomes, ...).
  const { data: allMatches, error: allMatchesError } = await db
    .from("matches")
    .select(
      "id, gender, stage, group_name, slot_home, slot_away, home_team_id, away_team_id, status, home_score, away_score, home_so_score, away_so_score, venue",
    );
  if (allMatchesError) return { ok: false, error: allMatchesError.message };

  const venueById = new Map((allMatches ?? []).map((m) => [m.id, m.venue]));
  const resolvable: ResolvableMatch[] = (allMatches ?? []).map((m) => ({
    id: m.id,
    gender: m.gender,
    stage: m.stage,
    groupName: m.group_name,
    slotHome: m.slot_home,
    slotAway: m.slot_away,
    homeTeamId: m.home_team_id,
    awayTeamId: m.away_team_id,
    status: m.status,
    homeScore: m.home_score,
    awayScore: m.away_score,
    homeSoScore: m.home_so_score,
    awaySoScore: m.away_so_score,
  }));

  const slotUpdates = resolvePendingMatches(resolvable);
  await Promise.all(
    slotUpdates.map((u) => {
      const patch: { home_team_id?: string; away_team_id?: string } = {};
      if (u.homeTeamId) patch.home_team_id = u.homeTeamId;
      if (u.awayTeamId) patch.away_team_id = u.awayTeamId;
      return db.from("matches").update(patch).eq("id", u.matchId);
    }),
  );

  // 5. Refresh odds for every still-open match with known participants. Recomputing
  // all of them (rather than tracking exactly what changed) is simple and cheap at
  // this dataset's size (~100 matches) and avoids subtly-wrong partial invalidation.
  const updatedMatchById = new Map(resolvable.map((m) => [m.id, m]));
  for (const u of slotUpdates) {
    const m = updatedMatchById.get(u.matchId);
    if (m) updatedMatchById.set(u.matchId, { ...m, homeTeamId: u.homeTeamId ?? m.homeTeamId, awayTeamId: u.awayTeamId ?? m.awayTeamId });
  }

  const oddsUpdates = [...updatedMatchById.values()].filter(
    (m) => m.status === "scheduled" && m.homeTeamId && m.awayTeamId,
  );

  await Promise.all(
    oddsUpdates.map((m) => {
      const oHomeName = teamNameById.get(m.homeTeamId as string) ?? "";
      const oAwayName = teamNameById.get(m.awayTeamId as string) ?? "";
      const venue = venueById.get(m.id);
      const advantage = venue ? crowdAdvantageFor(venue, oHomeName, oAwayName) : null;

      const odds = computeMatchOdds({
        homeElo: eloByTeamId.get(m.homeTeamId as string) ?? 1500,
        awayElo: eloByTeamId.get(m.awayTeamId as string) ?? 1500,
        stage: m.stage,
        crowdAdvantage: advantage,
      });

      return db
        .from("matches")
        .update({ odds_home: odds.home, odds_draw: odds.draw, odds_away: odds.away, odds_updated_at: nowIso })
        .eq("id", m.id);
    }),
  );

  return { ok: true, slotsResolved: slotUpdates.length, oddsRefreshed: oddsUpdates.length };
}
