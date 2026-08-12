import { describe, expect, it } from "vitest";
import {
  applyOverround,
  computeMatchOdds,
  expectedGoals,
  outcomeProbabilities,
  poissonPmf,
  probabilitiesToDecimalOdds,
  redistributeDrawForShootout,
  updateElo,
} from "./engine";

describe("poissonPmf", () => {
  it("sums to ~1 across a wide enough range of k", () => {
    const lambda = 1.75;
    let sum = 0;
    for (let k = 0; k <= 30; k++) sum += poissonPmf(k, lambda);
    expect(sum).toBeCloseTo(1, 6);
  });
});

describe("expectedGoals", () => {
  it("is symmetric for equal Elo and no home advantage", () => {
    const { home, away } = expectedGoals({ homeElo: 1500, awayElo: 1500 });
    expect(home).toBeCloseTo(away, 9);
  });

  it("gives the higher-rated team more expected goals", () => {
    const { home, away } = expectedGoals({ homeElo: 1700, awayElo: 1500 });
    expect(home).toBeGreaterThan(away);
  });

  it("adds a flat bonus for the home side's crowd advantage", () => {
    const withAdv = expectedGoals({ homeElo: 1500, awayElo: 1500, crowdAdvantage: "home" });
    const without = expectedGoals({ homeElo: 1500, awayElo: 1500, crowdAdvantage: null });
    expect(withAdv.home).toBeGreaterThan(without.home);
    expect(withAdv.away).toBeCloseTo(without.away, 9);
  });

  it("adds the bonus to the away side when the host nation is listed as away", () => {
    const withAdv = expectedGoals({ homeElo: 1500, awayElo: 1500, crowdAdvantage: "away" });
    const without = expectedGoals({ homeElo: 1500, awayElo: 1500, crowdAdvantage: null });
    expect(withAdv.away).toBeGreaterThan(without.away);
    expect(withAdv.home).toBeCloseTo(without.home, 9);
  });
});

describe("outcomeProbabilities", () => {
  it("sums to 1", () => {
    const probs = outcomeProbabilities(1.75, 1.75);
    expect(probs.home + probs.draw + probs.away).toBeCloseTo(1, 6);
  });

  it("is symmetric when both sides have equal expected goals", () => {
    const probs = outcomeProbabilities(1.75, 1.75);
    expect(probs.home).toBeCloseTo(probs.away, 6);
  });

  it("favours the side with higher expected goals", () => {
    const probs = outcomeProbabilities(2.4, 1.5);
    expect(probs.home).toBeGreaterThan(probs.away);
  });
});

describe("redistributeDrawForShootout", () => {
  it("splits the draw probability between home and away, summing to 1", () => {
    const probs = { home: 0.4, draw: 0.2, away: 0.4 };
    const result = redistributeDrawForShootout(probs, 1500, 1500);
    expect(result.home + result.away).toBeCloseTo(1, 9);
  });

  it("gives the equal-Elo case an even 50/50 split of the draw mass", () => {
    const probs = { home: 0.4, draw: 0.2, away: 0.4 };
    const result = redistributeDrawForShootout(probs, 1500, 1500);
    expect(result.home).toBeCloseTo(result.away, 9);
  });

  it("never gives the shoot-out split more than a 55/45 lean, however large the Elo gap", () => {
    const probs = { home: 0.5, draw: 0.2, away: 0.3 };
    const result = redistributeDrawForShootout(probs, 2200, 1200);
    const homeShareOfDraw = (result.home - probs.home) / probs.draw;
    expect(homeShareOfDraw).toBeLessThanOrEqual(0.55 + 1e-9);
  });
});

describe("applyOverround", () => {
  it("inflates fair probabilities so they sum to the target overround", () => {
    const fair = [0.5, 0.2, 0.3];
    const inflated = applyOverround(fair, 1.12);
    const sum = inflated.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.12, 4);
  });

  it("loads proportionally more margin onto the longshot than the favourite", () => {
    const fair = [0.7, 0.1, 0.2];
    const inflated = applyOverround(fair, 1.12);
    const favouriteRatio = inflated[0] / fair[0];
    const longshotRatio = inflated[1] / fair[1];
    expect(longshotRatio).toBeGreaterThan(favouriteRatio);
  });
});

describe("probabilitiesToDecimalOdds", () => {
  it("inverts probabilities and rounds to 2 decimals", () => {
    expect(probabilitiesToDecimalOdds([0.5, 0.25])).toEqual([2, 4]);
  });
});

describe("computeMatchOdds", () => {
  it("returns three priced outcomes for a round1 (draw-allowed) match", () => {
    const odds = computeMatchOdds({ homeElo: 1600, awayElo: 1500, stage: "round1" });
    expect(odds.draw).not.toBeNull();
    expect(odds.home).toBeGreaterThan(1);
    expect(odds.away).toBeGreaterThan(1);
  });

  it("returns a null draw and only two priced outcomes for a knockout match", () => {
    const odds = computeMatchOdds({ homeElo: 1600, awayElo: 1500, stage: "semifinal" });
    expect(odds.draw).toBeNull();
  });

  it("prices implied probabilities to roughly the target overround", () => {
    const odds = computeMatchOdds({ homeElo: 1500, awayElo: 1500, stage: "round1", overroundTarget: 1.12 });
    const implied = 1 / odds.home + 1 / (odds.draw as number) + 1 / odds.away;
    expect(implied).toBeCloseTo(1.12, 1);
  });

  it("gives the stronger team shorter odds", () => {
    const odds = computeMatchOdds({ homeElo: 1800, awayElo: 1400, stage: "round1" });
    expect(odds.home).toBeLessThan(odds.away);
  });
});

describe("updateElo", () => {
  it("does not move ratings for a draw between equally-rated teams", () => {
    const { homeElo, awayElo } = updateElo({
      homeElo: 1500,
      awayElo: 1500,
      homeGoals: 2,
      awayGoals: 2,
      stage: "round1",
    });
    expect(homeElo).toBeCloseTo(1500, 6);
    expect(awayElo).toBeCloseTo(1500, 6);
  });

  it("rewards an upset win more than an expected one", () => {
    const upset = updateElo({ homeElo: 1400, awayElo: 1700, homeGoals: 2, awayGoals: 1, stage: "round1" });
    const expectedWin = updateElo({ homeElo: 1700, awayElo: 1400, homeGoals: 2, awayGoals: 1, stage: "round1" });
    const upsetGain = upset.homeElo - 1400;
    const expectedGain = expectedWin.homeElo - 1700;
    expect(upsetGain).toBeGreaterThan(expectedGain);
  });

  it("is zero-sum", () => {
    const { homeElo, awayElo } = updateElo({
      homeElo: 1500,
      awayElo: 1450,
      homeGoals: 3,
      awayGoals: 1,
      stage: "final",
    });
    expect(homeElo - 1500).toBeCloseTo(-(awayElo - 1450), 9);
  });

  it("moves ratings more for a bigger goal margin", () => {
    const narrow = updateElo({ homeElo: 1500, awayElo: 1500, homeGoals: 1, awayGoals: 0, stage: "round1" });
    const blowout = updateElo({ homeElo: 1500, awayElo: 1500, homeGoals: 5, awayGoals: 0, stage: "round1" });
    expect(blowout.homeElo - 1500).toBeGreaterThan(narrow.homeElo - 1500);
  });

  it("weighs knockout stages more heavily than round1", () => {
    const round1 = updateElo({ homeElo: 1500, awayElo: 1500, homeGoals: 2, awayGoals: 1, stage: "round1" });
    const final = updateElo({ homeElo: 1500, awayElo: 1500, homeGoals: 2, awayGoals: 1, stage: "final" });
    expect(final.homeElo - 1500).toBeGreaterThan(round1.homeElo - 1500);
  });
});
