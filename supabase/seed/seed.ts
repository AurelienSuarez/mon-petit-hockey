import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { computeMatchOdds } from "../../src/lib/odds/engine";
import type { MatchStage } from "../../src/lib/types";
import { SEED_TEAMS } from "./teams";
import { SEED_MATCHES } from "./matches";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment (see .env.local).");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

/** Belgium hosts at Wavre, the Netherlands hosts at Amstelveen (doc 3.3). */
function crowdAdvantageFor(
  homeName: string,
  awayName: string,
  venue: "wavre" | "amstelveen",
): "home" | "away" | null {
  const hostTeam = venue === "wavre" ? "Belgique" : "Pays-Bas";
  if (homeName === hostTeam) return "home";
  if (awayName === hostTeam) return "away";
  return null;
}

async function main() {
  const { count: predictionCount, error: countError } = await supabase
    .from("predictions")
    .select("*", { count: "exact", head: true });
  if (countError) throw countError;

  if (predictionCount && predictionCount > 0 && !process.argv.includes("--force")) {
    console.error(
      `Refusing to reseed: ${predictionCount} prediction(s) already exist. Seeding wipes and recreates ` +
        `teams/matches, which would orphan them. Pass --force if you really mean it.`,
    );
    process.exit(1);
  }

  console.log("Clearing existing matches, team ratings and teams...");
  const wipe = async (table: string, keyColumn: string) => {
    const { error } = await supabase.from(table).delete().neq(keyColumn, "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
  };
  await wipe("matches", "id");
  await wipe("team_ratings", "team_id");
  await wipe("teams", "id");

  console.log(`Inserting ${SEED_TEAMS.length} teams...`);
  const { data: insertedTeams, error: teamsError } = await supabase
    .from("teams")
    .insert(SEED_TEAMS.map((t) => ({ name: t.name, gender: t.gender, round1_group: t.round1Group, site: t.site })))
    .select("id, name, gender");
  if (teamsError) throw teamsError;

  const teamIdByKey = new Map<string, string>();
  for (const t of insertedTeams ?? []) teamIdByKey.set(`${t.name}|${t.gender}`, t.id);

  console.log("Seeding team Elo ratings...");
  const eloByTeamId = new Map<string, number>();
  const ratingsRows = SEED_TEAMS.map((t) => {
    const teamId = teamIdByKey.get(`${t.name}|${t.gender}`);
    if (!teamId) throw new Error(`Team not found after insert: ${t.name} (${t.gender})`);
    eloByTeamId.set(teamId, t.initialElo);
    return { team_id: teamId, elo: t.initialElo };
  });
  const { error: ratingsError } = await supabase.from("team_ratings").insert(ratingsRows);
  if (ratingsError) throw ratingsError;

  console.log(`Inserting ${SEED_MATCHES.length} matches...`);
  const matchRows = SEED_MATCHES.map((m) => {
    const homeTeamId = "team" in m.home ? teamIdByKey.get(`${m.home.team}|${m.gender}`) : null;
    const awayTeamId = "team" in m.away ? teamIdByKey.get(`${m.away.team}|${m.gender}`) : null;
    if ("team" in m.home && !homeTeamId) throw new Error(`Unknown team: ${m.home.team} (${m.gender})`);
    if ("team" in m.away && !awayTeamId) throw new Error(`Unknown team: ${m.away.team} (${m.gender})`);

    let odds: { home: number; draw: number | null; away: number } | null = null;
    if (homeTeamId && awayTeamId) {
      const homeName = "team" in m.home ? m.home.team : "";
      const awayName = "team" in m.away ? m.away.team : "";
      odds = computeMatchOdds({
        homeElo: eloByTeamId.get(homeTeamId)!,
        awayElo: eloByTeamId.get(awayTeamId)!,
        stage: m.stage as MatchStage,
        crowdAdvantage: crowdAdvantageFor(homeName, awayName, m.venue),
      });
    }

    return {
      stage: m.stage,
      gender: m.gender,
      group_name: m.groupName ?? null,
      slot_home: "slot" in m.home ? m.home.slot : null,
      slot_away: "slot" in m.away ? m.away.slot : null,
      home_team_id: homeTeamId ?? null,
      away_team_id: awayTeamId ?? null,
      kickoff: m.kickoff,
      venue: m.venue,
      time_uncertain: m.timeUncertain ?? false,
      placement_label: m.placementLabel ?? null,
      odds_home: odds?.home ?? null,
      odds_draw: odds?.draw ?? null,
      odds_away: odds?.away ?? null,
      odds_updated_at: odds ? new Date().toISOString() : null,
    };
  });

  const { error: matchesError } = await supabase.from("matches").insert(matchRows);
  if (matchesError) throw matchesError;

  console.log("Done. Round1 matches have initial odds; later-stage matches will get odds once slots resolve.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
