export type Outcome = "home" | "draw" | "away";

export interface ScoringRules {
  exactScore: number;
  correctDifference: number;
  correctOutcome: number;
  shootoutBonus: number;
}

export const DEFAULT_SCORING_RULES: ScoringRules = {
  exactScore: 5,
  correctDifference: 3,
  correctOutcome: 1,
  shootoutBonus: 1,
};

export interface ScoreLine {
  homeScore: number;
  awayScore: number;
}

export interface Prediction extends ScoreLine {
  /** Only meaningful when the prediction itself is a tied score in a knockout-stage match. */
  shootoutWinner?: "home" | "away" | null;
}

export interface MatchResult extends ScoreLine {
  wentToShootout: boolean;
  shootoutWinner?: "home" | "away" | null;
}

export function regulationOutcome(score: ScoreLine): Outcome {
  if (score.homeScore > score.awayScore) return "home";
  if (score.homeScore < score.awayScore) return "away";
  return "draw";
}

export function goalDifference(score: ScoreLine): number {
  return score.homeScore - score.awayScore;
}

/**
 * MPP-style scoring: exact score > correct outcome + correct goal difference >
 * correct outcome only > wrong. A knockout-stage draw prediction additionally
 * carries a shoot-out winner guess, scored as a separate bonus on top.
 */
export function computePoints(
  prediction: Prediction,
  result: MatchResult,
  rules: ScoringRules = DEFAULT_SCORING_RULES,
): number {
  let base = 0;

  if (prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore) {
    base = rules.exactScore;
  } else if (regulationOutcome(prediction) === regulationOutcome(result)) {
    base =
      goalDifference(prediction) === goalDifference(result)
        ? rules.correctDifference
        : rules.correctOutcome;
  }

  const predictedATie = prediction.homeScore === prediction.awayScore;
  const shootoutBonus =
    result.wentToShootout &&
    predictedATie &&
    prediction.shootoutWinner != null &&
    prediction.shootoutWinner === result.shootoutWinner
      ? rules.shootoutBonus
      : 0;

  return base + shootoutBonus;
}
