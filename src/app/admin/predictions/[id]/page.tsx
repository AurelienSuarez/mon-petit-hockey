import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatKickoff } from "@/lib/format";
import { TeamLabel } from "@/components/team-label";
import { GenderBadge } from "@/components/gender-badge";

export default async function AdminMatchPredictionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const db = createAdminClient();

  const { data: match } = await supabase.from("matches").select("*").eq("id", id).single();
  if (!match) notFound();

  const teamIds = [match.home_team_id, match.away_team_id].filter((v): v is string => Boolean(v));
  const [{ data: teams }, { data: profiles }, { data: predictions }] = await Promise.all([
    teamIds.length ? supabase.from("teams").select("id, name").in("id", teamIds) : Promise.resolve({ data: [] }),
    db.from("profiles").select("id, username").order("username", { ascending: true }),
    db
      .from("predictions")
      .select("user_id, pred_home_score, pred_away_score, pred_shootout_winner, points")
      .eq("match_id", id),
  ]);

  const teamsById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const homeName = match.home_team_id ? (teamsById.get(match.home_team_id) ?? null) : null;
  const awayName = match.away_team_id ? (teamsById.get(match.away_team_id) ?? null) : null;

  const predictionByUser = new Map((predictions ?? []).map((p) => [p.user_id, p]));
  const rows = (profiles ?? []).map((p) => ({ ...p, prediction: predictionByUser.get(p.id) ?? null }));

  const shootoutLabel = (winner: string | null, home: string | null, away: string | null) => {
    if (!winner) return "";
    const label = winner === "home" ? (home ?? "domicile") : (away ?? "extérieur");
    return ` (t.a.b. ${label})`;
  };

  return (
    <>
      <p style={{ marginBottom: "0.75rem" }}>
        <Link href="/admin/predictions">← Tous les matchs</Link>
      </p>
      <h1>
        <GenderBadge gender={match.gender} /> <TeamLabel name={homeName} slot={match.slot_home} /> –{" "}
        <TeamLabel name={awayName} slot={match.slot_away} />
      </h1>
      <p className="muted" style={{ marginBottom: "1.25rem" }}>
        {formatKickoff(match.kickoff, "full")}
        {match.status === "finished" && (
          <>
            {" "}
            · Résultat : {match.home_score} – {match.away_score}
            {match.home_so_score != null && ` (t.a.b. ${match.home_so_score}-${match.away_so_score})`}
          </>
        )}
      </p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Pronostic</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.username}</td>
                <td>
                  {r.prediction ? (
                    <>
                      {r.prediction.pred_home_score} – {r.prediction.pred_away_score}
                      {shootoutLabel(r.prediction.pred_shootout_winner, homeName, awayName)}
                    </>
                  ) : (
                    <span className="muted">pas de pronostic</span>
                  )}
                </td>
                <td>{r.prediction?.points ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
