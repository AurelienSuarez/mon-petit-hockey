import type { MatchStage } from "@/lib/types";
import { stageAllowsDraw } from "@/lib/types";

// --- Elo rating updates -----------------------------------------------------

export const ELO_K_BASE = 20;

/** Higher stakes move ratings more, per the reference doc's "enjeu du match" adjustment. */
export const STAGE_K_MULTIPLIER: Record<MatchStage, number> = {
  round1: 1,
  crossgroup: 1.3,
  ranking: 1.2,
  semifinal: 1.6,
  third_place: 1.4,
  final: 1.8,
};

export interface EloUpdateInput {
  homeElo: number;
  awayElo: number;
  homeGoals: number;
  awayGoals: number;
  stage: MatchStage;
}

export interface EloUpdateResult {
  homeElo: number;
  awayElo: number;
}

/**
 * Standard Elo update. Shoot-out results are treated as a regulation draw (0.5/0.5) for
 * rating purposes: the 70 minutes were genuinely even, and a shoot-out is close to a
 * coin flip (cf. reference doc 3.3) so it shouldn't move ratings like a real win would.
 */
export function updateElo({ homeElo, awayElo, homeGoals, awayGoals, stage }: EloUpdateInput): EloUpdateResult {
  const expectedHome = 1 / (1 + 10 ** ((awayElo - homeElo) / 400));
  const actualHome = homeGoals > awayGoals ? 1 : homeGoals < awayGoals ? 0 : 0.5;

  const goalDiff = Math.abs(homeGoals - awayGoals);
  const marginMultiplier = 1 + Math.log(1 + goalDiff);

  const k = ELO_K_BASE * STAGE_K_MULTIPLIER[stage] * marginMultiplier;
  const delta = k * (actualHome - expectedHome);

  return { homeElo: homeElo + delta, awayElo: awayElo - delta };
}

// --- Elo -> expected goals ---------------------------------------------------

/** Hockey averages ~3-4 goals/match combined (doc 3.3) vs ~2.7 for football. */
export const BASE_GOALS_PER_TEAM = 1.75;

/** How strongly an Elo gap bends the goal expectancy ratio between the two sides. */
export const ELO_GOAL_SENSITIVITY = 0.5;

/** Flat goal bonus for the host nation playing on its own site (BEL@Wavre, NED@Amstelveen). */
export const HOME_ADVANTAGE_GOALS = 0.35;

export interface ExpectedGoalsInput {
  homeElo: number;
  awayElo: number;
  /**
   * Which side, if either, is the host nation playing on its own site. Fixture
   * listing order in the source doc isn't a real home/away designation, so this is
   * driven by which team is actually Belgium@Wavre or the Netherlands@Amstelveen,
   * independent of whether they're the first or second team named.
   */
  crowdAdvantage?: "home" | "away" | null;
}

export interface ExpectedGoals {
  home: number;
  away: number;
}

export function expectedGoals({ homeElo, awayElo, crowdAdvantage = null }: ExpectedGoalsInput): ExpectedGoals {
  const eloDiff = homeElo - awayElo;
  const ratioShift = Math.exp((ELO_GOAL_SENSITIVITY * eloDiff) / 400);

  const home = BASE_GOALS_PER_TEAM * ratioShift + (crowdAdvantage === "home" ? HOME_ADVANTAGE_GOALS : 0);
  const away = BASE_GOALS_PER_TEAM / ratioShift + (crowdAdvantage === "away" ? HOME_ADVANTAGE_GOALS : 0);

  return { home, away };
}

// --- Poisson score matrix ----------------------------------------------------

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

export function poissonPmf(k: number, lambda: number): number {
  return (lambda ** k * Math.exp(-lambda)) / factorial(k);
}

export const MAX_GOALS = 10;

export interface OutcomeProbabilities {
  home: number;
  draw: number;
  away: number;
}

/**
 * Independent Poisson score matrix summed into 1X2 probabilities. The reference doc
 * notes the Dixon-Coles low-score correction (needed for football, where 0-0/1-0/0-1
 * are systematically under/over-represented) matters less for hockey's higher-scoring
 * games, so plain independent Poisson is used here.
 */
export function outcomeProbabilities(homeLambda: number, awayLambda: number): OutcomeProbabilities {
  let home = 0;
  let draw = 0;
  let away = 0;

  for (let i = 0; i <= MAX_GOALS; i++) {
    const pHomeI = poissonPmf(i, homeLambda);
    for (let j = 0; j <= MAX_GOALS; j++) {
      const p = pHomeI * poissonPmf(j, awayLambda);
      if (i > j) home += p;
      else if (i < j) away += p;
      else draw += p;
    }
  }

  // Renormalize away the (tiny) truncation residual from capping at MAX_GOALS.
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}

/**
 * In knockout stages a regulation draw is resolved by shoot-out, so the market only
 * has two outcomes. The draw probability mass is redistributed using a shoot-out win
 * share slightly favouring the stronger side (doc 3.3: "un 55/45 est un point de
 * départ défendable, pas un 50/50"), scaled smoothly by the Elo gap and bounded to
 * [45%, 55%] so it never overrides the regulation-time signal.
 */
export function redistributeDrawForShootout(
  probs: OutcomeProbabilities,
  homeElo: number,
  awayElo: number,
): { home: number; away: number } {
  const eloDiff = homeElo - awayElo;
  const homeShare = clamp(0.5 + 0.05 * Math.tanh(eloDiff / 200), 0.45, 0.55);

  return {
    home: probs.home + probs.draw * homeShare,
    away: probs.away + probs.draw * (1 - homeShare),
  };
}

function clamp(x: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, x));
}

// --- Overround / margin -------------------------------------------------------

/** Niche market (doc 2.2): wider margin than a liquid market like the Premier League. */
export const DEFAULT_OVERROUND_TARGET = 1.12;

/**
 * "Power" denormalization (doc 2.2, method 2) applied in reverse: given fair
 * probabilities p_i (summing to 1), find an exponent k in (0, 1) such that
 * Σ p_i^k = targetOverround, then price outcome i at 1 / p_i^k. Because 0 < k < 1,
 * p_i^k inflates small probabilities proportionally more than large ones, which is
 * exactly the favourite-longshot bias the doc warns simple multiplicative
 * normalization ignores: outsiders get loaded with more of the margin than favourites.
 */
export function applyOverround(
  fairProbabilities: number[],
  targetOverround: number = DEFAULT_OVERROUND_TARGET,
): number[] {
  const sumAtK = (k: number) => fairProbabilities.reduce((sum, p) => sum + p ** k, 0);

  let low = 1e-6;
  let high = 1;
  for (let iter = 0; iter < 100; iter++) {
    const mid = (low + high) / 2;
    if (sumAtK(mid) > targetOverround) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const k = (low + high) / 2;

  return fairProbabilities.map((p) => p ** k);
}

export function probabilitiesToDecimalOdds(marketProbabilities: number[]): number[] {
  return marketProbabilities.map((p) => Math.round((1 / p) * 100) / 100);
}

// --- Top-level: full match odds computation ----------------------------------

export interface MatchOddsInput {
  homeElo: number;
  awayElo: number;
  stage: MatchStage;
  crowdAdvantage?: "home" | "away" | null;
  overroundTarget?: number;
}

export interface MatchOdds {
  home: number;
  draw: number | null;
  away: number;
  fairProbabilities: OutcomeProbabilities;
}

export function computeMatchOdds({
  homeElo,
  awayElo,
  stage,
  crowdAdvantage = null,
  overroundTarget = DEFAULT_OVERROUND_TARGET,
}: MatchOddsInput): MatchOdds {
  const { home: homeLambda, away: awayLambda } = expectedGoals({ homeElo, awayElo, crowdAdvantage });
  const probs = outcomeProbabilities(homeLambda, awayLambda);

  if (stageAllowsDraw(stage)) {
    const [homeOdds, drawOdds, awayOdds] = probabilitiesToDecimalOdds(
      applyOverround([probs.home, probs.draw, probs.away], overroundTarget),
    );
    return { home: homeOdds, draw: drawOdds, away: awayOdds, fairProbabilities: probs };
  }

  const twoWay = redistributeDrawForShootout(probs, homeElo, awayElo);
  const [homeOdds, awayOdds] = probabilitiesToDecimalOdds(
    applyOverround([twoWay.home, twoWay.away], overroundTarget),
  );
  return { home: homeOdds, draw: null, away: awayOdds, fairProbabilities: probs };
}
