import type { Gender, MatchStage } from "@/lib/types";
import { computeGroupStandings, isPhaseComplete, type TeamStanding } from "./standings";
import { CROSSGROUP_SOURCE, crossGroupTeamIds, resolveSlot, type SemifinalKey, type SemifinalOutcome } from "./slots";

export interface ResolvableMatch {
  id: string;
  gender: Gender;
  stage: MatchStage;
  groupName: string | null;
  slotHome: string | null;
  slotAway: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  status: "scheduled" | "finished";
  homeScore: number | null;
  awayScore: number | null;
  homeSoScore: number | null;
  awaySoScore: number | null;
}

export interface SlotResolution {
  matchId: string;
  homeTeamId?: string;
  awayTeamId?: string;
}

const ROUND1_GROUPS = ["A", "B", "C", "D"] as const;
const CROSSGROUPS = ["E", "F", "G", "H"] as const;

function winnerOf(m: ResolvableMatch): "home" | "away" | null {
  if (m.homeScore == null || m.awayScore == null) return null;
  if (m.homeScore !== m.awayScore) return m.homeScore > m.awayScore ? "home" : "away";
  // Knockout draw: resolved by shoot-out.
  if (m.homeSoScore == null || m.awaySoScore == null) return null;
  return m.homeSoScore > m.awaySoScore ? "home" : "away";
}

function finishedResultsOf(matches: ResolvableMatch[]) {
  return matches
    .filter((m) => m.status === "finished" && m.homeTeamId && m.awayTeamId && m.homeScore != null && m.awayScore != null)
    .map((m) => ({
      homeTeamId: m.homeTeamId as string,
      awayTeamId: m.awayTeamId as string,
      homeScore: m.homeScore as number,
      awayScore: m.awayScore as number,
    }));
}

/**
 * One sweep of slot resolution for a single gender. Safe to call at any point in the
 * tournament and to re-run repeatedly (e.g. after every result entry): each step only
 * commits a standing once every match feeding it is finished, so partial results never
 * lock in a wrong rank, and already-resolved matches are left untouched.
 */
function resolveForGender(allMatchesForGender: ResolvableMatch[]): SlotResolution[] {
  const standingsByGroup: Record<string, TeamStanding[]> = {};
  const finishedResults = finishedResultsOf(allMatchesForGender);

  for (const group of ROUND1_GROUPS) {
    const groupMatches = allMatchesForGender.filter((m) => m.stage === "round1" && m.groupName === group);
    if (!groupMatches.length || !isPhaseComplete(groupMatches.map((m) => m.status))) continue;
    const teamIds = [...new Set(groupMatches.flatMap((m) => [m.homeTeamId as string, m.awayTeamId as string]))];
    standingsByGroup[group] = computeGroupStandings(teamIds, finishedResults);
  }

  for (const crossGroup of CROSSGROUPS) {
    const { groups } = CROSSGROUP_SOURCE[crossGroup];
    if (!groups.every((g) => standingsByGroup[g])) continue;

    const crossGroupMatches = allMatchesForGender.filter((m) => m.stage === "crossgroup" && m.groupName === crossGroup);
    if (!crossGroupMatches.length || !isPhaseComplete(crossGroupMatches.map((m) => m.status))) continue;

    const teamIds = crossGroupTeamIds(crossGroup, standingsByGroup);
    standingsByGroup[crossGroup] = computeGroupStandings(teamIds, finishedResults);
  }

  // SF1 = the F1-vs-E2 semifinal, SF2 = the E1-vs-F2 semifinal (fixed convention, see slots.ts).
  const semifinalOutcomes: Partial<Record<SemifinalKey, SemifinalOutcome>> = {};
  for (const m of allMatchesForGender.filter((match) => match.stage === "semifinal")) {
    if (m.status !== "finished" || !m.homeTeamId || !m.awayTeamId) continue;
    const outcome = winnerOf(m);
    if (!outcome) continue;

    const pair = new Set([m.slotHome, m.slotAway]);
    let key: SemifinalKey | null = null;
    if (pair.has("F1") && pair.has("E2")) key = "SF1";
    else if (pair.has("E1") && pair.has("F2")) key = "SF2";
    if (!key) continue;

    semifinalOutcomes[key] =
      outcome === "home"
        ? { winnerTeamId: m.homeTeamId, loserTeamId: m.awayTeamId }
        : { winnerTeamId: m.awayTeamId, loserTeamId: m.homeTeamId };
  }

  const updatesByMatch = new Map<string, SlotResolution>();
  const record = (matchId: string, side: "home" | "away", teamId: string) => {
    const existing = updatesByMatch.get(matchId) ?? { matchId };
    if (side === "home") existing.homeTeamId = teamId;
    else existing.awayTeamId = teamId;
    updatesByMatch.set(matchId, existing);
  };

  for (const m of allMatchesForGender) {
    if (m.slotHome && !m.homeTeamId) {
      const resolved = resolveSlot(m.slotHome, { standingsByGroup, semifinalOutcomes });
      if (resolved) record(m.id, "home", resolved);
    }
    if (m.slotAway && !m.awayTeamId) {
      const resolved = resolveSlot(m.slotAway, { standingsByGroup, semifinalOutcomes });
      if (resolved) record(m.id, "away", resolved);
    }
  }

  return [...updatesByMatch.values()];
}

/** Runs the resolution sweep independently for each gender and combines the results. */
export function resolvePendingMatches(allMatches: ResolvableMatch[]): SlotResolution[] {
  const genders: Gender[] = ["M", "F"];
  return genders.flatMap((gender) => resolveForGender(allMatches.filter((m) => m.gender === gender)));
}
