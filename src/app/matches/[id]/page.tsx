import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatKickoff } from "@/lib/format";
import { slotLabel } from "@/lib/tournament/labels";
import { hasPassed } from "@/lib/time";
import { TeamLabel } from "@/components/team-label";
import { KNOCKOUT_STAGES } from "@/lib/types";
import { PredictionForm } from "./prediction-form";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: match } = await supabase.from("matches").select("*").eq("id", id).single();
  if (!match) notFound();

  const teamIds = [match.home_team_id, match.away_team_id].filter((v): v is string => Boolean(v));
  const { data: teams } = teamIds.length
    ? await supabase.from("teams").select("id, name").in("id", teamIds)
    : { data: [] };
  const teamsById = new Map((teams ?? []).map((t) => [t.id, t.name]));

  const homeName = match.home_team_id ? (teamsById.get(match.home_team_id) ?? null) : null;
  const awayName = match.away_team_id ? (teamsById.get(match.away_team_id) ?? null) : null;
  const homeLabel = homeName ?? (match.slot_home ? slotLabel(match.slot_home) : "?");
  const awayLabel = awayName ?? (match.slot_away ? slotLabel(match.slot_away) : "?");

  const { data: myPrediction } = await supabase
    .from("predictions")
    .select("pred_home_score, pred_away_score, pred_shootout_winner, points")
    .eq("match_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isLocked = hasPassed(match.kickoff);
  const canPredict = match.home_team_id && match.away_team_id && !isLocked;

  let others: { username: string; pred_home_score: number; pred_away_score: number; points: number | null }[] = [];
  if (isLocked) {
    const { data: visible } = await supabase
      .from("visible_predictions")
      .select("user_id, pred_home_score, pred_away_score, points")
      .eq("match_id", id)
      .neq("user_id", user.id);

    if (visible?.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in(
          "id",
          visible.map((v) => v.user_id),
        );
      const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username]));
      others = visible.map((v) => ({
        username: usernameById.get(v.user_id) ?? "?",
        pred_home_score: v.pred_home_score,
        pred_away_score: v.pred_away_score,
        points: v.points,
      }));
    }
  }

  return (
    <>
      <div className="card">
        <div className="row" style={{ justifyContent: "center", gap: "1.5rem" }}>
          <TeamLabel name={homeName} slot={match.slot_home} />
          <span className="score-vs">
            {match.status === "finished" ? `${match.home_score} – ${match.away_score}` : "vs"}
          </span>
          <TeamLabel name={awayName} slot={match.slot_away} />
        </div>
        <p className="muted" style={{ textAlign: "center", marginTop: "0.75rem" }}>
          {formatKickoff(match.kickoff, "full")}
          {match.time_uncertain && " ⚠ horaire à confirmer"} · {match.venue === "wavre" ? "Wavre" : "Amstelveen"}
          {match.placement_label ? ` · ${match.placement_label}` : ""}
        </p>
        <div className="row" style={{ justifyContent: "center", marginTop: "0.5rem" }}>
          <span className="odds-pill">{match.odds_home ?? "–"}</span>
          <span className="odds-pill">{match.odds_draw ?? "–"}</span>
          <span className="odds-pill">{match.odds_away ?? "–"}</span>
        </div>
        {match.status === "finished" && match.home_so_score != null && (
          <p className="muted" style={{ textAlign: "center" }}>
            Shoot-out : {match.home_so_score}-{match.away_so_score}
          </p>
        )}
      </div>

      {canPredict ? (
        <div className="card" style={{ marginTop: "1rem" }}>
          <PredictionForm
            matchId={match.id}
            homeLabel={homeLabel}
            awayLabel={awayLabel}
            existing={myPrediction ?? null}
            isKnockout={KNOCKOUT_STAGES.includes(match.stage)}
          />
        </div>
      ) : myPrediction ? (
        <p className="card" style={{ marginTop: "1rem", textAlign: "center" }}>
          Ton pronostic : <strong>{myPrediction.pred_home_score} – {myPrediction.pred_away_score}</strong>
          {myPrediction.points != null && (
            <span className="badge badge-accent" style={{ marginLeft: "0.5rem" }}>
              {myPrediction.points} pts
            </span>
          )}
        </p>
      ) : (
        <p className="muted" style={{ marginTop: "1rem", textAlign: "center" }}>
          {!match.home_team_id || !match.away_team_id
            ? "Les équipes ne sont pas encore connues pour ce match."
            : "Pronostics fermés pour ce match."}
        </p>
      )}

      {isLocked && others.length > 0 && (
        <>
          <h2>Pronostics des autres</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Joueur</th>
                  <th>Score</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {others.map((o, i) => (
                  <tr key={i}>
                    <td>{o.username}</td>
                    <td>
                      {o.pred_home_score} – {o.pred_away_score}
                    </td>
                    <td>{o.points ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
