export interface FinishedMatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

export interface TeamStanding {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

function emptyStanding(teamId: string): TeamStanding {
  return { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
}

function applyResult(standing: TeamStanding, goalsFor: number, goalsAgainst: number): TeamStanding {
  const won = goalsFor > goalsAgainst ? 1 : 0;
  const drawn = goalsFor === goalsAgainst ? 1 : 0;
  const lost = goalsFor < goalsAgainst ? 1 : 0;
  return {
    ...standing,
    played: standing.played + 1,
    won: standing.won + won,
    drawn: standing.drawn + drawn,
    lost: standing.lost + lost,
    goalsFor: standing.goalsFor + goalsFor,
    goalsAgainst: standing.goalsAgainst + goalsAgainst,
    points: standing.points + won * 3 + drawn * 1,
  };
}

export function goalDifference(s: TeamStanding): number {
  return s.goalsFor - s.goalsAgainst;
}

/**
 * Ranks a set of teams from every finished match played between two members of that
 * set. This one rule handles both round1 pools (a plain round robin) and the E/F/G/H
 * crossgroup pools: for a crossgroup, the set naturally picks up each team's carried
 * round1 result against the other team from its original pool (doc 1.2: "les points
 * acquis au premier tour ... sont reportés") plus its two new crossgroup matches,
 * without needing to special-case which matches were "carried" vs "new".
 *
 * Tiebreakers: points, goal difference, goals scored, then team id (deterministic
 * fallback — the source document doesn't specify FIH's exact head-to-head rules, so
 * this is a documented best-effort default that can be revisited if needed).
 */
export function computeGroupStandings(teamIds: string[], matches: FinishedMatchResult[]): TeamStanding[] {
  const idSet = new Set(teamIds);
  const standings = new Map(teamIds.map((id) => [id, emptyStanding(id)]));

  for (const m of matches) {
    if (!idSet.has(m.homeTeamId) || !idSet.has(m.awayTeamId)) continue;
    const home = standings.get(m.homeTeamId);
    const away = standings.get(m.awayTeamId);
    if (!home || !away) continue;
    standings.set(m.homeTeamId, applyResult(home, m.homeScore, m.awayScore));
    standings.set(m.awayTeamId, applyResult(away, m.awayScore, m.homeScore));
  }

  return [...standings.values()].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    const gdDiff = goalDifference(b) - goalDifference(a);
    if (gdDiff !== 0) return gdDiff;
    if (a.goalsFor !== b.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamId.localeCompare(b.teamId);
  });
}

export function isPhaseComplete(matchStatuses: Array<"scheduled" | "finished">): boolean {
  return matchStatuses.length > 0 && matchStatuses.every((s) => s === "finished");
}
