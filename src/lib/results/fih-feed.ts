// No "server-only" guard (see sync.ts) — this is also reachable from custom-worker.ts.
import { FIH_TEAM_NAME_TO_FRENCH } from "./team-names";

/**
 * Undocumented public JSON feed that FIH's own site uses to render its results widget
 * (backed by Sportradar under the hood — note the sr_* fields). No API key, no ToS
 * page found anywhere on fih.hockey for it. Not an officially supported API: it could
 * change shape or disappear without notice, which is why every field read here is
 * defensively parsed and a bad/unrecognized match is skipped rather than thrown on.
 */
const FIH_FEED_BASE =
  "https://www.fih.hockey/default.aspx?methodtype=3&client=8696669363&sport=5&league=0&timezone=0530&language=en&tournament=";

// series_id for "FIH Hockey World Cup Belgium & Netherlands 2026", one per gender.
const FIH_SERIES_ID: Record<"M" | "F", number> = { M: 1866, F: 1867 };

interface FihParticipant {
  name: string;
  is_home: string;
  value: string;
  secondary_score: string;
}

interface FihMatch {
  date: string;
  event_status: string;
  game_id: string;
  participants: FihParticipant[];
}

interface FihFeedResponse {
  matches?: FihMatch[];
}

export interface FihCompletedMatch {
  gender: "M" | "F";
  gameId: string;
  date: string;
  homeTeamName: string; // French, matches this app's teams.name
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  /** Non-null only when the feed reports distinct, parseable shootout scores. */
  homeSoScore: number | null;
  awaySoScore: number | null;
}

async function fetchFihSeries(gender: "M" | "F"): Promise<FihMatch[]> {
  const res = await fetch(FIH_FEED_BASE + FIH_SERIES_ID[gender]);
  if (!res.ok) throw new Error(`fih_feed_http_${res.status}`);
  const data = (await res.json()) as FihFeedResponse;
  return data.matches ?? [];
}

function parseShootout(home: FihParticipant, away: FihParticipant): [number | null, number | null] {
  const homeSo = Number(home.secondary_score);
  const awaySo = Number(away.secondary_score);
  const bothPresent = home.secondary_score !== "" && away.secondary_score !== "";
  if (!bothPresent || !Number.isFinite(homeSo) || !Number.isFinite(awaySo) || homeSo === awaySo) {
    return [null, null];
  }
  return [homeSo, awaySo];
}

/**
 * Every match FIH currently reports as finished, across both World Cup editions.
 * Unrecognized teams or unparseable scores are silently dropped (defensive against
 * feed changes) — callers should treat a short result list as "nothing new found",
 * not as an error.
 */
export async function fetchCompletedFihMatches(): Promise<FihCompletedMatch[]> {
  const [menMatches, womenMatches] = await Promise.all([fetchFihSeries("M"), fetchFihSeries("F")]);

  const tagged: Array<{ gender: "M" | "F"; match: FihMatch }> = [
    ...menMatches.map((match) => ({ gender: "M" as const, match })),
    ...womenMatches.map((match) => ({ gender: "F" as const, match })),
  ];

  const results: FihCompletedMatch[] = [];
  for (const { gender, match } of tagged) {
    if (match.event_status !== "Match Completed") continue;

    const home = match.participants?.find((p) => p.is_home === "1");
    const away = match.participants?.find((p) => p.is_home === "0");
    if (!home || !away) continue;

    const homeTeamName = FIH_TEAM_NAME_TO_FRENCH[home.name];
    const awayTeamName = FIH_TEAM_NAME_TO_FRENCH[away.name];
    if (!homeTeamName || !awayTeamName) continue;

    const homeScore = Number(home.value);
    const awayScore = Number(away.value);
    if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) continue;

    const [homeSoScore, awaySoScore] = parseShootout(home, away);

    results.push({
      gender,
      gameId: match.game_id,
      date: match.date,
      homeTeamName,
      awayTeamName,
      homeScore,
      awayScore,
      homeSoScore,
      awaySoScore,
    });
  }

  // Chronological order matters: finalizeMatchResult() resolves bracket slots as it
  // goes, so an earlier-round match must be applied before a later round that depends
  // on its outcome is looked up.
  results.sort((a, b) => a.date.localeCompare(b.date));
  return results;
}
