import { describe, expect, it } from "vitest";
import { computeGroupStandings } from "./standings";
import { crossGroupTeamIds, parseSlot, resolveSlot } from "./slots";

describe("parseSlot", () => {
  it("parses a group letter + rank", () => {
    expect(parseSlot("A1")).toEqual({ group: "A", rank: 1 });
    expect(parseSlot("G3")).toEqual({ group: "G", rank: 3 });
  });

  it("throws on malformed input", () => {
    expect(() => parseSlot("1A")).toThrow();
    expect(() => parseSlot("AA")).toThrow();
    expect(() => parseSlot("A5")).toThrow();
  });
});

describe("crossGroupTeamIds", () => {
  const standingsA = computeGroupStandings(
    ["ned", "arg", "jpn", "nzl"],
    [
      { homeTeamId: "ned", awayTeamId: "arg", homeScore: 3, awayScore: 1 },
      { homeTeamId: "ned", awayTeamId: "jpn", homeScore: 4, awayScore: 0 },
      { homeTeamId: "ned", awayTeamId: "nzl", homeScore: 5, awayScore: 1 },
      { homeTeamId: "arg", awayTeamId: "jpn", homeScore: 2, awayScore: 1 },
      { homeTeamId: "arg", awayTeamId: "nzl", homeScore: 3, awayScore: 0 },
      { homeTeamId: "jpn", awayTeamId: "nzl", homeScore: 2, awayScore: 2 },
    ],
  );

  const standingsD = computeGroupStandings(
    ["eng", "ind", "pak", "wal"],
    [
      { homeTeamId: "eng", awayTeamId: "ind", homeScore: 3, awayScore: 2 },
      { homeTeamId: "eng", awayTeamId: "pak", homeScore: 2, awayScore: 0 },
      { homeTeamId: "eng", awayTeamId: "wal", homeScore: 4, awayScore: 1 },
      { homeTeamId: "ind", awayTeamId: "pak", homeScore: 1, awayScore: 0 },
      { homeTeamId: "ind", awayTeamId: "wal", homeScore: 2, awayScore: 1 },
      { homeTeamId: "pak", awayTeamId: "wal", homeScore: 1, awayScore: 1 },
    ],
  );

  it("picks ranks 1-2 of pools A and D for crossgroup E", () => {
    const teams = crossGroupTeamIds("E", { A: standingsA, D: standingsD });
    expect(teams).toEqual(["ned", "arg", "eng", "ind"]);
  });

  it("picks ranks 3-4 of pools A and D for crossgroup G", () => {
    const teams = crossGroupTeamIds("G", { A: standingsA, D: standingsD });
    expect(teams).toEqual(["jpn", "nzl", "pak", "wal"]);
  });

  it("throws if the source group's standings are missing", () => {
    expect(() => crossGroupTeamIds("E", { A: standingsA })).toThrow();
  });
});

describe("resolveSlot", () => {
  const standingsByGroup = {
    A: computeGroupStandings(
      ["ned", "arg"],
      [{ homeTeamId: "ned", awayTeamId: "arg", homeScore: 3, awayScore: 1 }],
    ),
  };

  it("resolves a known group-rank slot to the team at that rank", () => {
    expect(resolveSlot("A1", { standingsByGroup })).toBe("ned");
    expect(resolveSlot("A2", { standingsByGroup })).toBe("arg");
  });

  it("returns undefined when the group isn't resolved yet", () => {
    expect(resolveSlot("E1", { standingsByGroup })).toBeUndefined();
  });

  it("returns undefined when the rank is out of range", () => {
    expect(resolveSlot("A4", { standingsByGroup })).toBeUndefined();
  });

  it("resolves a semifinal winner/loser slot once the outcome is known", () => {
    const context = {
      standingsByGroup: {},
      semifinalOutcomes: { SF1: { winnerTeamId: "ned", loserTeamId: "arg" } },
    };
    expect(resolveSlot("SF1W", context)).toBe("ned");
    expect(resolveSlot("SF1L", context)).toBe("arg");
  });

  it("returns undefined for a semifinal slot whose outcome isn't known yet", () => {
    expect(resolveSlot("SF2W", { standingsByGroup: {} })).toBeUndefined();
  });
});
