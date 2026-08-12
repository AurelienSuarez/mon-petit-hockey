import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computePoints, type MatchResult } from "@/lib/scoring/points";
import { computeMatchOdds, updateElo } from "@/lib/odds/engine";
import { resolvePendingMatches, type ResolvableMatch } from "@/lib/tournament/resolve";
import { KNOCKOUT_STAGES } from "@/lib/types";

const bodySchema = z
  .object({
    matchId: z.string().uuid(),
    homeScore: z.number().int().min(0).max(50),
    awayScore: z.number().int().min(0).max(50),
    homeSoScore: z.number().int().min(0).max(50).nullable().optional(),
    awaySoScore: z.number().int().min(0).max(50).nullable().optional(),
  })
  .refine((b) => (b.homeSoScore == null) === (b.awaySoScore == null), {
    message: "homeSoScore and awaySoScore must be provided together",
  });

/**
 * Records a final result and cascades every downstream effect: scores predictions,
 * updates Elo, resolves any round1/crossgroup/knockout slots this result unblocks,
 * and refreshes odds for every still-open match. Not wrapped in a single DB
 * transaction (Supabase's JS client can't span one across these steps) — acceptable
 * for a friend-group pool, but a crash mid-way could leave a partially-applied
 * update. Re-running the whole flow isn't safe (Elo would be double-applied), which
 * is why this route refuses to touch a match that's already 'finished'.
 */
export async function POST(request: Request) {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: profile } = await session.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "not_admin" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.issues }, { status: 400 });
  }
  const { matchId, homeScore, awayScore, homeSoScore, awaySoScore } = parsed.data;

  const db = createAdminClient();

  const { data: match, error: matchError } = await db.from("matches").select("*").eq("id", matchId).single();
  if (matchError || !match) return NextResponse.json({ error: "match_not_found" }, { status: 404 });

  if (match.status === "finished") {
    return NextResponse.json({ error: "already_finished" }, { status: 409 });
  }
  if (!match.home_team_id || !match.away_team_id) {
    return NextResponse.json({ error: "teams_not_resolved" }, { status: 409 });
  }

  const isKnockout = KNOCKOUT_STAGES.includes(match.stage);
  const isTie = homeScore === awayScore;
  if (isKnockout && isTie && (homeSoScore == null || awaySoScore == null || homeSoScore === awaySoScore)) {
    return NextResponse.json({ error: "shootout_scores_required" }, { status: 400 });
  }

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
  if (updateMatchError) return NextResponse.json({ error: updateMatchError.message }, { status: 500 });

  // 2. Score every prediction made for this match.
  const wentToShootout = isKnockout && isTie;
  const shootoutWinner: "home" | "away" | null = wentToShootout
    ? (homeSoScore as number) > (awaySoScore as number)
      ? "home"
      : "away"
    : null;
  const matchResult: MatchResult = { homeScore, awayScore, wentToShootout, shootoutWinner };

  const { data: predictions, error: predictionsError } = await db
    .from("predictions")
    .select("id, pred_home_score, pred_away_score, pred_shootout_winner")
    .eq("match_id", matchId);
  if (predictionsError) return NextResponse.json({ error: predictionsError.message }, { status: 500 });

  await Promise.all(
    (predictions ?? []).map((p) => {
      const points = computePoints(
        { homeScore: p.pred_home_score, awayScore: p.pred_away_score, shootoutWinner: p.pred_shootout_winner },
        matchResult,
      );
      return db.from("predictions").update({ points }).eq("id", p.id);
    }),
  );

  // 3. Update Elo for both teams.
  const { data: ratings, error: ratingsError } = await db
    .from("team_ratings")
    .select("team_id, elo")
    .in("team_id", [match.home_team_id, match.away_team_id]);
  if (ratingsError) return NextResponse.json({ error: ratingsError.message }, { status: 500 });

  const eloByTeamId = new Map((ratings ?? []).map((r) => [r.team_id, r.elo]));
  const { homeElo, awayElo } = updateElo({
    homeElo: eloByTeamId.get(match.home_team_id) ?? 1500,
    awayElo: eloByTeamId.get(match.away_team_id) ?? 1500,
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
  if (allMatchesError) return NextResponse.json({ error: allMatchesError.message }, { status: 500 });

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
  const { data: teams, error: teamsError } = await db.from("teams").select("id, name");
  if (teamsError) return NextResponse.json({ error: teamsError.message }, { status: 500 });
  const teamNameById = new Map((teams ?? []).map((t) => [t.id, t.name]));

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
      const homeName = teamNameById.get(m.homeTeamId as string) ?? "";
      const awayName = teamNameById.get(m.awayTeamId as string) ?? "";
      const venue = venueById.get(m.id);
      const hostTeam = venue === "wavre" ? "Belgique" : venue === "amstelveen" ? "Pays-Bas" : null;
      const crowdAdvantage: "home" | "away" | null =
        hostTeam && homeName === hostTeam ? "home" : hostTeam && awayName === hostTeam ? "away" : null;

      const odds = computeMatchOdds({
        homeElo: eloByTeamId.get(m.homeTeamId as string) ?? 1500,
        awayElo: eloByTeamId.get(m.awayTeamId as string) ?? 1500,
        stage: m.stage,
        crowdAdvantage,
      });

      return db
        .from("matches")
        .update({ odds_home: odds.home, odds_draw: odds.draw, odds_away: odds.away, odds_updated_at: nowIso })
        .eq("id", m.id);
    }),
  );

  return NextResponse.json({ ok: true, slotsResolved: slotUpdates.length, oddsRefreshed: oddsUpdates.length });
}
