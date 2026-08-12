"use client";

import { useActionState, useState } from "react";
import { submitPredictionAction, type PredictionActionState } from "../actions";

const initialState: PredictionActionState = { error: null };

export function PredictionForm({
  matchId,
  homeLabel,
  awayLabel,
  existing,
}: {
  matchId: string;
  homeLabel: string;
  awayLabel: string;
  existing: { pred_home_score: number; pred_away_score: number; pred_shootout_winner: "home" | "away" | null } | null;
}) {
  const [state, formAction, pending] = useActionState(submitPredictionAction, initialState);
  const [homeScore, setHomeScore] = useState(existing?.pred_home_score ?? 0);
  const [awayScore, setAwayScore] = useState(existing?.pred_away_score ?? 0);
  const isTie = homeScore === awayScore;

  return (
    <form action={formAction}>
      <input type="hidden" name="matchId" value={matchId} />
      <label>
        {homeLabel}
        <input
          type="number"
          name="homeScore"
          min={0}
          max={30}
          required
          value={homeScore}
          onChange={(e) => setHomeScore(Number(e.target.value))}
        />
      </label>
      <label>
        {awayLabel}
        <input
          type="number"
          name="awayScore"
          min={0}
          max={30}
          required
          value={awayScore}
          onChange={(e) => setAwayScore(Number(e.target.value))}
        />
      </label>
      {isTie && (
        <label>
          Vainqueur du shoot-out (si égalité en phase finale)
          <select name="shootoutWinner" defaultValue={existing?.pred_shootout_winner ?? ""}>
            <option value="">–</option>
            <option value="home">{homeLabel}</option>
            <option value="away">{awayLabel}</option>
          </select>
        </label>
      )}
      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="muted">Pronostic enregistré.</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : existing ? "Mettre à jour" : "Valider mon pronostic"}
      </button>
    </form>
  );
}
