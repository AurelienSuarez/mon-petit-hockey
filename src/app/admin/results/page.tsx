import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKickoff } from "@/lib/format";
import { TeamLabel } from "@/components/team-label";
import { GenderBadge } from "@/components/gender-badge";
import { ResultForm } from "./result-form";
import { SyncFihButton } from "./sync-fih-button";

const KNOCKOUT_STAGES = new Set(["semifinal", "third_place", "final"]);

export default async function AdminResultsPage() {
  const { supabase } = await requireAdmin();
  // Predictions/league_members are RLS-scoped to "my own" / "leagues I'm in" — an
  // admin summary needs to see across every user and league, so this uses the
  // service-role client rather than the session-bound one from requireAdmin().
  const db = createAdminClient();

  const [{ data: matches }, { data: teams }, { count: totalUsers }, { data: predictionUserIds }, { count: totalPredictions }, { count: totalLeagues }, { count: totalMemberships }] =
    await Promise.all([
      supabase.from("matches").select("*").order("kickoff", { ascending: true }),
      supabase.from("teams").select("id, name"),
      db.from("profiles").select("*", { count: "exact", head: true }),
      db.from("predictions").select("user_id"),
      db.from("predictions").select("*", { count: "exact", head: true }),
      db.from("leagues").select("*", { count: "exact", head: true }),
      db.from("league_members").select("*", { count: "exact", head: true }),
    ]);

  const usersWithPredictions = new Set((predictionUserIds ?? []).map((p) => p.user_id)).size;

  const teamsById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const name = (teamId: string | null) => (teamId ? (teamsById.get(teamId) ?? null) : null);

  const all = matches ?? [];
  const pending = all.filter((m) => m.status === "scheduled" && m.home_team_id && m.away_team_id);
  const blocked = all.filter((m) => m.status === "scheduled" && (!m.home_team_id || !m.away_team_id));
  const finished = all.filter((m) => m.status === "finished");

  return (
    <>
      <h1>Saisie des résultats</h1>

      <div className="row" style={{ marginBottom: "1.25rem" }}>
        <span className="badge badge-muted">{totalUsers ?? 0} comptes créés</span>
        <span className="badge badge-muted">
          {usersWithPredictions} ont pronostiqué au moins une fois
        </span>
        <span className="badge badge-muted">{totalPredictions ?? 0} pronostics au total</span>
        <span className="badge badge-muted">{totalLeagues ?? 0} ligues créées</span>
        <span className="badge badge-muted">{totalMemberships ?? 0} adhésions à des ligues</span>
      </div>

      <p style={{ marginBottom: "1rem" }}>
        <Link href="/admin/predictions">Voir les pronostics des joueurs →</Link>
      </p>

      <SyncFihButton />

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
                  <GenderBadge gender={m.gender} />{" "}
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
            <GenderBadge gender={m.gender} /> <TeamLabel name={name(m.home_team_id)} slot={m.slot_home} /> –{" "}
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
                  <GenderBadge gender={m.gender} /> <TeamLabel name={name(m.home_team_id)} slot={m.slot_home} /> –{" "}
                  <TeamLabel name={name(m.away_team_id)} slot={m.slot_away} />
                </td>
                <td>
                  {m.home_score} – {m.away_score}
                  {m.home_so_score != null ? ` (shoot-out ${m.home_so_score}-${m.away_so_score})` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
