export type Outcome = "home" | "draw" | "away";

export interface RarityBonusThresholds {
  /** Below this exact-score probability: "Very rare" bonus. */
  veryRare: number;
  /** Below this (and above veryRare): "Rare" bonus. */
  rare: number;
  /** Below this (and above rare): "Exact" bonus. Above it: no bonus ("Common"). */
  common: number;
}

export interface OddsScoringRules {
  /** Flat bonus added on top of the outcome odds when the exact score is hit. */
  exactScoreBonus: { common: number; exact: number; rare: number; veryRare: number };
  rarityThresholds: RarityBonusThresholds;
  shootoutBonus: number;
}

/**
 * MPP-style odds-driven scoring, reverse-engineered from a reference user's bet
 * history (screenshots + PDF export, 2026-08-13): a wrong outcome always scores 0; a
 * correct outcome (regardless of goal difference) scores the decimal odds for that
 * outcome x10, rounded; an exact score adds a flat bonus on top, tiered by how
 * statistically rare that exact scoreline was — confirmed data points: cote 36 exact
 * hit labelled "Very rare +50pts" (total 86), cote 58 "Rare +30pts" (total 88), cote
 * 109 "Exact +20pts". No confirmed example of the true zero-bonus floor exists in the
 * source material, so the "common" tier and the probability thresholds below are this
 * app's own best-effort calibration (using its own Poisson exact-score model, which
 * MPP's source doesn't expose) rather than directly observed values — tune freely.
 */
export const DEFAULT_ODDS_RULES: OddsScoringRules = {
  exactScoreBonus: { common: 0, exact: 20, rare: 30, veryRare: 50 },
  rarityThresholds: { veryRare: 0.005, rare: 0.02, common: 0.05 },
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

function exactScoreRarityBonus(probability: number, rules: OddsScoringRules): number {
  const { veryRare, rare, common } = rules.rarityThresholds;
  if (probability < veryRare) return rules.exactScoreBonus.veryRare;
  if (probability < rare) return rules.exactScoreBonus.rare;
  if (probability < common) return rules.exactScoreBonus.exact;
  return rules.exactScoreBonus.common;
}

/**
 * @param predictedOutcomeOdds Decimal odds (with overround) for the outcome the user
 * predicted, from a snapshot of the match's win/draw/win model taken when the
 * prediction was locked in — not the live odds, which can have drifted since.
 * @param exactScoreProbability Fair (no-overround) Poisson probability of the exact
 * scoreline predicted, from that same locked snapshot.
 */
export function computePoints(
  prediction: Prediction,
  result: MatchResult,
  predictedOutcomeOdds: number,
  exactScoreProbability: number,
  rules: OddsScoringRules = DEFAULT_ODDS_RULES,
): number {
  if (regulationOutcome(prediction) !== regulationOutcome(result)) return 0;

  let points = Math.round(predictedOutcomeOdds * 10);

  if (prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore) {
    points += exactScoreRarityBonus(exactScoreProbability, rules);
  }

  const predictedATie = prediction.homeScore === prediction.awayScore;
  const shootoutBonus =
    result.wentToShootout &&
    predictedATie &&
    prediction.shootoutWinner != null &&
    prediction.shootoutWinner === result.shootoutWinner
      ? rules.shootoutBonus
      : 0;

  return points + shootoutBonus;
}
