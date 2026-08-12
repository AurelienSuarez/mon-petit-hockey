import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { slotLabel } from "@/lib/tournament/labels";
import { hasPassed } from "@/lib/time";
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

  const homeLabel = match.home_team_id
    ? (teamsById.get(match.home_team_id) ?? "?")
    : match.slot_home
      ? slotLabel(match.slot_home)
      : "?";
  const awayLabel = match.away_team_id
    ? (teamsById.get(match.away_team_id) ?? "?")
    : match.slot_away
      ? slotLabel(match.slot_away)
      : "?";

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
      <h1>
        {homeLabel} – {awayLabel}
      </h1>
      <p className="muted">
        {new Date(match.kickoff).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
        {match.time_uncertain && " ⚠ horaire à confirmer"} · {match.venue === "wavre" ? "Wavre" : "Amstelveen"}
        {match.placement_label ? ` · ${match.placement_label}` : ""}
      </p>
      <p>
        Cotes : {match.odds_home ?? "–"} / {match.odds_draw ?? "–"} / {match.odds_away ?? "–"}
      </p>

      {match.status === "finished" && (
        <p>
          <strong>
            Score final : {match.home_score} – {match.away_score}
            {match.home_so_score != null ? ` (tab: ${match.home_so_score}-${match.away_so_score})` : ""}
          </strong>
        </p>
      )}

      {canPredict ? (
        <PredictionForm
          matchId={match.id}
          homeLabel={homeLabel}
          awayLabel={awayLabel}
          existing={myPrediction ?? null}
        />
      ) : myPrediction ? (
        <p>
          Ton pronostic : {myPrediction.pred_home_score} – {myPrediction.pred_away_score}
          {myPrediction.points != null ? ` → ${myPrediction.points} pts` : ""}
        </p>
      ) : (
        <p className="muted">
          {!match.home_team_id || !match.away_team_id
            ? "Les équipes ne sont pas encore connues pour ce match."
            : "Pronostics fermés pour ce match."}
        </p>
      )}

      {isLocked && others.length > 0 && (
        <>
          <h2>Pronostics des autres</h2>
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
        </>
      )}
    </>
  );
}
