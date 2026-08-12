import { describe, expect, it } from "vitest";
import { computeGroupStandings, isPhaseComplete } from "./standings";

describe("computeGroupStandings", () => {
  // A round-robin group modeled on doc 1.1's men's pool A (Amstelveen).
  const groupAMatches = [
    { homeTeamId: "ned", awayTeamId: "arg", homeScore: 3, awayScore: 1 },
    { homeTeamId: "ned", awayTeamId: "jpn", homeScore: 4, awayScore: 0 },
    { homeTeamId: "ned", awayTeamId: "nzl", homeScore: 5, awayScore: 1 },
    { homeTeamId: "arg", awayTeamId: "jpn", homeScore: 2, awayScore: 1 },
    { homeTeamId: "arg", awayTeamId: "nzl", homeScore: 3, awayScore: 0 },
    { homeTeamId: "jpn", awayTeamId: "nzl", homeScore: 2, awayScore: 2 },
  ];

  it("ranks by points, then goal difference, then goals for", () => {
    const standings = computeGroupStandings(["ned", "arg", "jpn", "nzl"], groupAMatches);
    expect(standings.map((s) => s.teamId)).toEqual(["ned", "arg", "jpn", "nzl"]);
    expect(standings[0]).toMatchObject({ points: 9, played: 3, won: 3 });
    // jpn and nzl are both on 1 point (a draw each); jpn's -5 GD beats nzl's -7 GD.
    expect(standings[2].points).toBe(1);
    expect(standings[3].points).toBe(1);
  });

  it("ignores matches involving teams outside the requested set", () => {
    const withNoise = [...groupAMatches, { homeTeamId: "ned", awayTeamId: "someone-else", homeScore: 9, awayScore: 0 }];
    const standings = computeGroupStandings(["ned", "arg", "jpn", "nzl"], withNoise);
    expect(standings.find((s) => s.teamId === "ned")?.played).toBe(3);
  });

  it("carries a round1 head-to-head into a crossgroup standing alongside new matches", () => {
    // Group D (doc 1.1, men's pool D, Amstelveen), needed as the other crossgroup E feeder.
    const groupDMatches = [
      { homeTeamId: "eng", awayTeamId: "ind", homeScore: 3, awayScore: 2 },
      { homeTeamId: "eng", awayTeamId: "pak", homeScore: 2, awayScore: 0 },
      { homeTeamId: "eng", awayTeamId: "wal", homeScore: 4, awayScore: 1 },
      { homeTeamId: "ind", awayTeamId: "pak", homeScore: 1, awayScore: 0 },
      { homeTeamId: "ind", awayTeamId: "wal", homeScore: 2, awayScore: 1 },
      { homeTeamId: "pak", awayTeamId: "wal", homeScore: 1, awayScore: 1 },
    ];

    // Crossgroup E = ranks 1-2 of A (ned, arg) + ranks 1-2 of D (eng, ind).
    // Only 2 new matches per team are played (doc 1.2); the ned-arg and eng-ind
    // round1 results should carry over automatically via set membership.
    const newCrossgroupMatches = [
      { homeTeamId: "ned", awayTeamId: "eng", homeScore: 3, awayScore: 2 },
      { homeTeamId: "ned", awayTeamId: "ind", homeScore: 4, awayScore: 1 },
      { homeTeamId: "arg", awayTeamId: "eng", homeScore: 1, awayScore: 1 },
      { homeTeamId: "arg", awayTeamId: "ind", homeScore: 2, awayScore: 0 },
    ];

    const standingsE = computeGroupStandings(
      ["ned", "arg", "eng", "ind"],
      [...groupAMatches, ...groupDMatches, ...newCrossgroupMatches],
    );

    // Each team should show 3 played matches: 1 carried round1 result + 2 new ones.
    expect(standingsE.every((s) => s.played === 3)).toBe(true);

    expect(standingsE.map((s) => s.teamId)).toEqual(["ned", "eng", "arg", "ind"]);
    expect(standingsE[0]).toMatchObject({ points: 9 });
    // eng and arg are tied on points and goal difference; eng's higher goalsFor wins the tiebreak.
    expect(standingsE[1].points).toBe(4);
    expect(standingsE[2].points).toBe(4);
    expect(standingsE[1].goalsFor).toBeGreaterThan(standingsE[2].goalsFor);
  });
});

describe("isPhaseComplete", () => {
  it("is false for an empty match list", () => {
    expect(isPhaseComplete([])).toBe(false);
  });

  it("is false when any match is still scheduled", () => {
    expect(isPhaseComplete(["finished", "finished", "scheduled"])).toBe(false);
  });

  it("is true once every match is finished", () => {
    expect(isPhaseComplete(["finished", "finished"])).toBe(true);
  });
});
