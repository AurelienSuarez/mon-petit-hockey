import { describe, expect, it } from "vitest";
import { computePoints, DEFAULT_SCORING_RULES } from "./points";

describe("computePoints", () => {
  const result = { homeScore: 3, awayScore: 1, wentToShootout: false };

  it("awards exactScore for an exact match", () => {
    expect(computePoints({ homeScore: 3, awayScore: 1 }, result)).toBe(
      DEFAULT_SCORING_RULES.exactScore,
    );
  });

  it("awards correctDifference for right outcome + right goal difference", () => {
    expect(computePoints({ homeScore: 2, awayScore: 0 }, result)).toBe(
      DEFAULT_SCORING_RULES.correctDifference,
    );
  });

  it("awards correctOutcome for right outcome only", () => {
    expect(computePoints({ homeScore: 1, awayScore: 0 }, result)).toBe(
      DEFAULT_SCORING_RULES.correctOutcome,
    );
  });

  it("awards 0 for a wrong outcome", () => {
    expect(computePoints({ homeScore: 0, awayScore: 1 }, result)).toBe(0);
  });

  it("awards 0 for a predicted draw when the match was not a draw", () => {
    expect(computePoints({ homeScore: 1, awayScore: 1 }, result)).toBe(0);
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
      );
      expect(points).toBe(DEFAULT_SCORING_RULES.exactScore + DEFAULT_SCORING_RULES.shootoutBonus);
    });

    it("does not award the bonus if the shoot-out winner guess is wrong", () => {
      const points = computePoints(
        { homeScore: 2, awayScore: 2, shootoutWinner: "away" },
        drawnResult,
      );
      expect(points).toBe(DEFAULT_SCORING_RULES.exactScore);
    });

    it("does not award the bonus if the user did not predict a tie", () => {
      const points = computePoints(
        { homeScore: 1, awayScore: 2, shootoutWinner: "home" },
        drawnResult,
      );
      expect(points).toBe(0);
    });

    it("does not award the bonus when the match never reached a shoot-out", () => {
      const points = computePoints(
        { homeScore: 3, awayScore: 3, shootoutWinner: "home" },
        result,
      );
      expect(points).toBe(0);
    });

    it("applies the bonus on top of a correct-difference score (predicted a different tie score)", () => {
      const looseDraw = {
        homeScore: 4,
        awayScore: 4,
        wentToShootout: true,
        shootoutWinner: "away" as const,
      };
      const points = computePoints(
        { homeScore: 1, awayScore: 1, shootoutWinner: "away" },
        looseDraw,
      );
      expect(points).toBe(
        DEFAULT_SCORING_RULES.correctDifference + DEFAULT_SCORING_RULES.shootoutBonus,
      );
    });
  });

  it("uses custom scoring rules when provided", () => {
    const points = computePoints(
      { homeScore: 3, awayScore: 1 },
      result,
      { exactScore: 10, correctDifference: 6, correctOutcome: 2, shootoutBonus: 2 },
    );
    expect(points).toBe(10);
  });
});
