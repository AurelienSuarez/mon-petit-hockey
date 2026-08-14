import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKickoff } from "@/lib/format";
import { TeamLabel } from "@/components/team-label";
import { GenderBadge } from "@/components/gender-badge";

export default async function AdminPredictionsPage() {
  const { supabase } = await requireAdmin();
  // Same reasoning as /admin/results: predictions are RLS-scoped to "my own", so an
  // admin overview across every user needs the service-role client.
  const db = createAdminClient();

  const [{ data: matches }, { data: teams }, { count: totalUsers }, { data: predictionCounts }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff", { ascending: true }),
    supabase.from("teams").select("id, name"),
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("predictions").select("match_id"),
  ]);

  const teamsById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const name = (teamId: string | null) => (teamId ? (teamsById.get(teamId) ?? null) : null);

  const countByMatch = new Map<string, number>();
  for (const p of predictionCounts ?? []) {
    countByMatch.set(p.match_id, (countByMatch.get(p.match_id) ?? 0) + 1);
  }

  const all = matches ?? [];

  return (
    <>
      <p style={{ marginBottom: "0.75rem" }}>
        <Link href="/admin/results">← Résultats</Link>
      </p>
      <h1>Pronostics des joueurs</h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        {totalUsers ?? 0} comptes au total. Clique un match pour voir le détail des pronostics.
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Match</th>
              <th>Pronostics</th>
            </tr>
          </thead>
          <tbody>
            {all.map((m) => {
              const count = countByMatch.get(m.id) ?? 0;
              return (
                <tr key={m.id}>
                  <td>{formatKickoff(m.kickoff)}</td>
                  <td>
                    <Link href={`/admin/predictions/${m.id}`}>
                      <GenderBadge gender={m.gender} />{" "}
                      <TeamLabel name={name(m.home_team_id)} slot={m.slot_home} /> –{" "}
                      <TeamLabel name={name(m.away_team_id)} slot={m.slot_away} />
                    </Link>
                  </td>
                  <td>
                    {count} / {totalUsers ?? 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
