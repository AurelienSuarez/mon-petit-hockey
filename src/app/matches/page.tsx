import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { slotLabel } from "@/lib/tournament/labels";

const GENDER_FILTERS = [
  { value: undefined, label: "Tous" },
  { value: "M", label: "Hommes" },
  { value: "F", label: "Femmes" },
] as const;

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ gender?: string }>;
}) {
  const { supabase } = await requireUser();
  const { gender } = await searchParams;
  const activeGender = gender === "M" || gender === "F" ? gender : undefined;

  let query = supabase.from("matches").select("*").order("kickoff", { ascending: true });
  if (activeGender) query = query.eq("gender", activeGender);

  const [{ data: matches }, { data: teams }] = await Promise.all([
    query,
    supabase.from("teams").select("id, name"),
  ]);

  const teamsById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const label = (teamId: string | null, slot: string | null) =>
    teamId ? (teamsById.get(teamId) ?? "?") : slot ? slotLabel(slot) : "?";

  return (
    <>
      <h1>Matchs</h1>
      <p>
        {GENDER_FILTERS.map((f, i) => (
          <span key={f.label}>
            {i > 0 && " · "}
            {activeGender === f.value ? (
              <strong>{f.label}</strong>
            ) : (
              <Link href={f.value ? `/matches?gender=${f.value}` : "/matches"}>{f.label}</Link>
            )}
          </span>
        ))}
      </p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Match</th>
            <th>Cotes (1 / N / 2)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {matches?.map((m) => (
            <tr key={m.id}>
              <td>
                {new Date(m.kickoff).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                {m.time_uncertain ? " ⚠" : ""}
              </td>
              <td>
                {m.gender === "F" ? "♀" : "♂"} {label(m.home_team_id, m.slot_home)} – {label(m.away_team_id, m.slot_away)}
                {m.placement_label ? ` (${m.placement_label})` : ""}
              </td>
              <td>
                {m.odds_home ?? "–"} / {m.odds_draw ?? "–"} / {m.odds_away ?? "–"}
              </td>
              <td>
                <Link href={`/matches/${m.id}`}>{m.status === "finished" ? "Résultat" : "Pronostiquer"}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
