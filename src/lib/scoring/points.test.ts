import { describe, expect, it } from "vitest";
import { computePoints, DEFAULT_ODDS_RULES } from "./points";

describe("computePoints", () => {
  const result = { homeScore: 3, awayScore: 1, wentToShootout: false };
  // Odds of 4.30 and an exact-score probability comfortably above every rarity
  // threshold, so tests can isolate the behaviour under test.
  const odds = 4.3;
  const commonProbability = 0.5;

  it("awards odds x10 for an exact score match", () => {
    expect(computePoints({ homeScore: 3, awayScore: 1 }, result, odds, commonProbability)).toBe(43);
  });

  it("awards odds x10 for right outcome with the wrong score, regardless of goal difference", () => {
    // Same outcome (home win), different goal difference from the 3-1 result.
    expect(computePoints({ homeScore: 2, awayScore: 0 }, result, odds, commonProbability)).toBe(43);
    expect(computePoints({ homeScore: 1, awayScore: 0 }, result, odds, commonProbability)).toBe(43);
  });

  it("awards 0 for a wrong outcome", () => {
    expect(computePoints({ homeScore: 0, awayScore: 1 }, result, odds, commonProbability)).toBe(0);
  });

  it("awards 0 for a predicted draw when the match was not a draw", () => {
    expect(computePoints({ homeScore: 1, awayScore: 1 }, result, odds, commonProbability)).toBe(0);
  });

  describe("exact-score rarity bonus", () => {
    it("adds nothing on top of the odds for a common exact score", () => {
      const points = computePoints({ homeScore: 3, awayScore: 1 }, result, odds, 0.5);
      expect(points).toBe(Math.round(odds * 10) + DEFAULT_ODDS_RULES.exactScoreBonus.common);
    });

    it("adds the 'exact' bonus just under the common threshold", () => {
      const points = computePoints({ homeScore: 3, awayScore: 1 }, result, odds, 0.03);
      expect(points).toBe(Math.round(odds * 10) + DEFAULT_ODDS_RULES.exactScoreBonus.exact);
    });

    it("adds the 'rare' bonus just under the exact threshold", () => {
      const points = computePoints({ homeScore: 3, awayScore: 1 }, result, odds, 0.01);
      expect(points).toBe(Math.round(odds * 10) + DEFAULT_ODDS_RULES.exactScoreBonus.rare);
    });

    it("adds the 'very rare' bonus for a tiny exact-score probability", () => {
      const points = computePoints({ homeScore: 3, awayScore: 1 }, result, odds, 0.001);
      expect(points).toBe(Math.round(odds * 10) + DEFAULT_ODDS_RULES.exactScoreBonus.veryRare);
    });

    it("never applies the rarity bonus for a non-exact (but correct-outcome) prediction", () => {
      const points = computePoints({ homeScore: 2, awayScore: 0 }, result, odds, 0.001);
      expect(points).toBe(Math.round(odds * 10));
    });
  });

  describe("knockout shoot-out bonus", () => {
    const drawnResult = {
      homeScore: 2,
      awayScore: 2,
      wentToShootout: true,
      shootoutWinner: "home" as const,
    };

    it("scores the draw as an exact score, plus the bonus if the shoot-out winner is right", () => {
      const points = computePoints(
        { homeScore: 2, awayScore: 2, shootoutWinner: "home" },
        drawnResult,
        odds,
        commonProbability,
      );
      expect(points).toBe(Math.round(odds * 10) + DEFAULT_ODDS_RULES.exactScoreBonus.common + DEFAULT_ODDS_RULES.shootoutBonus);
    });

    it("does not award the bonus if the shoot-out winner guess is wrong", () => {
      const points = computePoints(
        { homeScore: 2, awayScore: 2, shootoutWinner: "away" },
        drawnResult,
        odds,
        commonProbability,
      );
      expect(points).toBe(Math.round(odds * 10) + DEFAULT_ODDS_RULES.exactScoreBonus.common);
    });

    it("does not award the bonus if the user did not predict a tie", () => {
      const points = computePoints(
        { homeScore: 1, awayScore: 2, shootoutWinner: "home" },
        drawnResult,
        odds,
        commonProbability,
      );
      expect(points).toBe(0);
    });

    it("does not award the bonus when the match never reached a shoot-out", () => {
      const points = computePoints(
        { homeScore: 3, awayScore: 3, shootoutWinner: "home" },
        result,
        odds,
        commonProbability,
      );
      expect(points).toBe(0);
    });
  });

  it("uses custom rules when provided", () => {
    const customRules = {
      exactScoreBonus: { common: 5, exact: 25, rare: 35, veryRare: 55 },
      rarityThresholds: DEFAULT_ODDS_RULES.rarityThresholds,
      shootoutBonus: 2,
    };
    const points = computePoints({ homeScore: 3, awayScore: 1 }, result, odds, commonProbability, customRules);
    expect(points).toBe(Math.round(odds * 10) + 5);
  });
});
