import { requireAdmin } from "@/lib/auth";
import { formatKickoff } from "@/lib/format";
import { TeamLabel } from "@/components/team-label";
import { ResultForm } from "./result-form";

const KNOCKOUT_STAGES = new Set(["semifinal", "third_place", "final"]);

export default async function AdminResultsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: matches }, { data: teams }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff", { ascending: true }),
    supabase.from("teams").select("id, name"),
  ]);

  const teamsById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const name = (teamId: string | null) => (teamId ? (teamsById.get(teamId) ?? null) : null);

  const all = matches ?? [];
  const pending = all.filter((m) => m.status === "scheduled" && m.home_team_id && m.away_team_id);
  const blocked = all.filter((m) => m.status === "scheduled" && (!m.home_team_id || !m.away_team_id));
  const finished = all.filter((m) => m.status === "finished");

  return (
    <>
      <h1>Saisie des résultats</h1>

      <h2>À jouer, prêts à saisir ({pending.length})</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Match</th>
              <th>Résultat</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((m) => (
              <tr key={m.id}>
                <td>{formatKickoff(m.kickoff)}</td>
                <td>
                  <span className={`badge ${m.gender === "F" ? "badge-f" : "badge-m"}`}>
                    {m.gender === "F" ? "♀" : "♂"}
                  </span>{" "}
                  <TeamLabel name={name(m.home_team_id)} slot={m.slot_home} /> –{" "}
                  <TeamLabel name={name(m.away_team_id)} slot={m.slot_away} />
                </td>
                <td>
                  <ResultForm matchId={m.id} isKnockout={KNOCKOUT_STAGES.has(m.stage)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Équipes pas encore connues ({blocked.length})</h2>
      <div className="card stack" style={{ gap: "0.4rem" }}>
        {blocked.map((m) => (
          <div key={m.id} className="muted">
            {m.gender === "F" ? "♀" : "♂"} <TeamLabel name={name(m.home_team_id)} slot={m.slot_home} /> –{" "}
            <TeamLabel name={name(m.away_team_id)} slot={m.slot_away} />
            {m.placement_label ? ` (${m.placement_label})` : ""}
          </div>
        ))}
      </div>

      <h2>Terminés ({finished.length})</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Match</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {finished.map((m) => (
              <tr key={m.id}>
                <td>
                  {m.gender === "F" ? "♀" : "♂"} <TeamLabel name={name(m.home_team_id)} slot={m.slot_home} /> –{" "}
                  <TeamLabel name={name(m.away_team_id)} slot={m.slot_away} />
                </td>
                <td>
                  {m.home_score} – {m.away_score}
                  {m.home_so_score != null ? ` (tab ${m.home_so_score}-${m.away_so_score})` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
