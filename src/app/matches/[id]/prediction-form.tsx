"use client";

import { useActionState, useState } from "react";
import { submitPredictionAction, type PredictionActionState } from "../actions";

const initialState: PredictionActionState = { error: null };

export function PredictionForm({
  matchId,
  homeLabel,
  awayLabel,
  existing,
  isKnockout,
  compact = false,
}: {
  matchId: string;
  homeLabel: string;
  awayLabel: string;
  existing: { pred_home_score: number; pred_away_score: number; pred_shootout_winner: "home" | "away" | null } | null;
  /** Pool-stage matches (round1/crossgroup/ranking) just end in a draw — only
   * knockout-stage matches (semifinal/third_place/final) go to a shoot-out. */
  isKnockout: boolean;
  /** Skips the team-name labels either side of the score inputs — for use inside a
   * match card that already shows both teams' names/badges around the form. */
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitPredictionAction, initialState);
  // Blank rather than defaulting to 0-0: a 0-0 default would look like a real
  // prediction and would silently count as a tie, popping up the shoot-out question
  // before the user has entered anything.
  const [homeScore, setHomeScore] = useState<number | "">(existing?.pred_home_score ?? "");
  const [awayScore, setAwayScore] = useState<number | "">(existing?.pred_away_score ?? "");
  const isTie = isKnockout && homeScore !== "" && awayScore !== "" && homeScore === awayScore;

  return (
    <form action={formAction} className={compact ? "prediction-form-compact" : undefined}>
      <input type="hidden" name="matchId" value={matchId} />

      <div className="score-row">
        {!compact && <span className="team">{homeLabel}</span>}
        <input
          type="number"
          name="homeScore"
          min={0}
          max={30}
          required
          className="score-input"
          value={homeScore}
          onChange={(e) => setHomeScore(e.target.value === "" ? "" : Number(e.target.value))}
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
          onChange={(e) => setAwayScore(e.target.value === "" ? "" : Number(e.target.value))}
        />
        {!compact && <span className="team">{awayLabel}</span>}
      </div>

      {isTie && (
        <label>
          {compact ? "Vainqueur shoot-out" : "Vainqueur du shoot-out (si égalité en phase finale)"}
          <select name="shootoutWinner" defaultValue={existing?.pred_shootout_winner ?? ""}>
            <option value="">–</option>
            <option value="home">{homeLabel}</option>
            <option value="away">{awayLabel}</option>
          </select>
        </label>
      )}

      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success-note">✓ Enregistré</p>}

      <button type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "..." : compact ? existing ? "Modifier" : "Valider" : existing ? "Mettre à jour" : "Valider mon pronostic"}
      </button>
    </form>
  );
}
