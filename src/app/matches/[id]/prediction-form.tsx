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

      <div className="score-row">
        <span className="team">{homeLabel}</span>
        <input
          type="number"
          name="homeScore"
          min={0}
          max={30}
          required
          className="score-input"
          value={homeScore}
          onChange={(e) => setHomeScore(Number(e.target.value))}
        />
        <span className="score-vs">–</span>
        <input
          type="number"
          name="awayScore"
          min={0}
          max={30}
          required
          className="score-input"
          value={awayScore}
          onChange={(e) => setAwayScore(Number(e.target.value))}
        />
        <span className="team">{awayLabel}</span>
      </div>

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
      {state.success && <p className="success-note">✓ Pronostic enregistré.</p>}

      <button type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "Enregistrement..." : existing ? "Mettre à jour" : "Valider mon pronostic"}
      </button>
    </form>
  );
}
