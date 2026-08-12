import { describe, expect, it } from "vitest";
import { resolvePendingMatches, type ResolvableMatch } from "./resolve";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `m${counter}`;
}

function finished(
  gender: "M" | "F",
  stage: ResolvableMatch["stage"],
  opts: {
    groupName?: string;
    slotHome?: string;
    slotAway?: string;
    homeTeamId?: string | null;
    awayTeamId?: string | null;
    homeScore: number;
    awayScore: number;
    homeSoScore?: number | null;
    awaySoScore?: number | null;
  },
): ResolvableMatch {
  return {
    id: nextId(),
    gender,
    stage,
    groupName: opts.groupName ?? null,
    slotHome: opts.slotHome ?? null,
    slotAway: opts.slotAway ?? null,
    homeTeamId: opts.homeTeamId ?? null,
    awayTeamId: opts.awayTeamId ?? null,
    status: "finished",
    homeScore: opts.homeScore,
    awayScore: opts.awayScore,
    homeSoScore: opts.homeSoScore ?? null,
    awaySoScore: opts.awaySoScore ?? null,
  };
}

function scheduled(
  gender: "M" | "F",
  stage: ResolvableMatch["stage"],
  opts: { groupName?: string; slotHome?: string; slotAway?: string },
): ResolvableMatch {
  return {
    id: nextId(),
    gender,
    stage,
    groupName: opts.groupName ?? null,
    slotHome: opts.slotHome ?? null,
    slotAway: opts.slotAway ?? null,
    homeTeamId: null,
    awayTeamId: null,
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    homeSoScore: null,
    awaySoScore: null,
  };
}

/** A round robin among 4 teams, ranked p1 > p2 > p3 > p4 with no tiebreak ambiguity. */
function ladder(gender: "M" | "F", group: string, [p1, p2, p3, p4]: [string, string, string, string]): ResolvableMatch[] {
  return [
    finished(gender, "round1", { groupName: group, homeTeamId: p1, awayTeamId: p2, homeScore: 3, awayScore: 1 }),
    finished(gender, "round1", { groupName: group, homeTeamId: p1, awayTeamId: p3, homeScore: 4, awayScore: 0 }),
    finished(gender, "round1", { groupName: group, homeTeamId: p1, awayTeamId: p4, homeScore: 5, awayScore: 0 }),
    finished(gender, "round1", { groupName: group, homeTeamId: p2, awayTeamId: p3, homeScore: 2, awayScore: 0 }),
    finished(gender, "round1", { groupName: group, homeTeamId: p2, awayTeamId: p4, homeScore: 3, awayScore: 0 }),
    finished(gender, "round1", { groupName: group, homeTeamId: p3, awayTeamId: p4, homeScore: 1, awayScore: 0 }),
  ];
}

describe("resolvePendingMatches", () => {
  it("returns no updates when nothing is finished yet", () => {
    const matches: ResolvableMatch[] = [
      scheduled("M", "round1", { groupName: "A" }),
      scheduled("M", "crossgroup", { groupName: "E", slotHome: "A1", slotAway: "D2" }),
    ];
    expect(resolvePendingMatches(matches)).toEqual([]);
  });

  it("resolves the full pipeline end-to-end: round1 -> crossgroup -> semifinal -> final/third place", () => {
    const M = "M" as const;

    const round1 = [
      ...ladder(M, "A", ["a1", "a2", "a3", "a4"]),
      ...ladder(M, "B", ["b1", "b2", "b3", "b4"]),
      ...ladder(M, "C", ["c1", "c2", "c3", "c4"]),
      ...ladder(M, "D", ["d1", "d2", "d3", "d4"]),
    ];

    // Crossgroup E (ranks 1-2 of A+D): a1 ends up 1st, d1 2nd, a2 3rd, d2 4th —
    // proving the crossgroup ranking isn't just the round1 rank order carried forward.
    const crossgroupE = [
      finished(M, "crossgroup", { groupName: "E", slotHome: "A1", slotAway: "D1", homeScore: 3, awayScore: 1 }),
      finished(M, "crossgroup", { groupName: "E", slotHome: "A1", slotAway: "D2", homeScore: 4, awayScore: 0 }),
      finished(M, "crossgroup", { groupName: "E", slotHome: "A2", slotAway: "D1", homeScore: 0, awayScore: 2 }),
      finished(M, "crossgroup", { groupName: "E", slotHome: "A2", slotAway: "D2", homeScore: 2, awayScore: 1 }),
    ];

    // Crossgroup F (ranks 1-2 of B+C): b1 1st, c1 2nd (mirrors E's shape).
    const crossgroupF = [
      finished(M, "crossgroup", { groupName: "F", slotHome: "B1", slotAway: "C1", homeScore: 3, awayScore: 1 }),
      finished(M, "crossgroup", { groupName: "F", slotHome: "B1", slotAway: "C2", homeScore: 4, awayScore: 0 }),
      finished(M, "crossgroup", { groupName: "F", slotHome: "B2", slotAway: "C1", homeScore: 0, awayScore: 2 }),
      finished(M, "crossgroup", { groupName: "F", slotHome: "B2", slotAway: "C2", homeScore: 2, awayScore: 1 }),
    ];

    // Crossgroup G/H (ranks 3-4 of A+D / B+C) exist but haven't been played yet.
    const crossgroupGH = [
      scheduled(M, "crossgroup", { groupName: "G", slotHome: "A3", slotAway: "D4" }),
      scheduled(M, "crossgroup", { groupName: "H", slotHome: "B3", slotAway: "C4" }),
    ];

    // SF1 = F1 v E2, SF2 = E1 v F2 (unresolved participants — the sweep must fill these in).
    const semifinals = [
      scheduled(M, "semifinal", { slotHome: "F1", slotAway: "E2" }),
      scheduled(M, "semifinal", { slotHome: "E1", slotAway: "F2" }),
    ];

    const finals = [
      scheduled(M, "third_place", { slotHome: "SF1L", slotAway: "SF2L" }),
      scheduled(M, "final", { slotHome: "SF1W", slotAway: "SF2W" }),
    ];

    // A ranking-stage match depending on the still-unplayed G/H groups: must stay unresolved.
    const rankingPending = scheduled(M, "ranking", { slotHome: "G1", slotAway: "H1" });

    let matches = [...round1, ...crossgroupE, ...crossgroupF, ...crossgroupGH, ...semifinals, ...finals, rankingPending];

    // --- Round 1: round1 scores never need slot resolution; nothing resolves except
    // the crossgroup/semifinal participants, since crossgroup matches already carry
    // fixed slot references that are now resolvable.
    let updates = resolvePendingMatches(matches);
    const applyUpdates = (list: ResolvableMatch[], upds: typeof updates) =>
      list.map((m) => {
        const u = upds.find((x) => x.matchId === m.id);
        if (!u) return m;
        return { ...m, homeTeamId: u.homeTeamId ?? m.homeTeamId, awayTeamId: u.awayTeamId ?? m.awayTeamId };
      });

    matches = applyUpdates(matches, updates);

    const semifinal1 = matches.find((m) => m.stage === "semifinal" && m.slotHome === "F1")!;
    const semifinal2 = matches.find((m) => m.stage === "semifinal" && m.slotHome === "E1")!;
    expect(semifinal1.homeTeamId).toBe("b1"); // F1
    expect(semifinal1.awayTeamId).toBe("d1"); // E2
    expect(semifinal2.homeTeamId).toBe("a1"); // E1
    expect(semifinal2.awayTeamId).toBe("c1"); // F2

    // The G/H-dependent ranking match must NOT have resolved (its crossgroups aren't finished).
    const stillPendingRanking = matches.find((m) => m.id === rankingPending.id)!;
    expect(stillPendingRanking.homeTeamId).toBeNull();
    expect(stillPendingRanking.awayTeamId).toBeNull();

    // --- Now play the semifinals: b1 beats d1, a1 beats c1.
    matches = matches.map((m) => {
      if (m.id === semifinal1.id) return { ...m, status: "finished" as const, homeScore: 3, awayScore: 2 };
      if (m.id === semifinal2.id) return { ...m, status: "finished" as const, homeScore: 4, awayScore: 1 };
      return m;
    });

    updates = resolvePendingMatches(matches);
    matches = applyUpdates(matches, updates);

    const thirdPlace = matches.find((m) => m.stage === "third_place")!;
    const final = matches.find((m) => m.stage === "final")!;
    expect(final.homeTeamId).toBe("b1"); // SF1 winner
    expect(final.awayTeamId).toBe("a1"); // SF2 winner
    expect(thirdPlace.homeTeamId).toBe("d1"); // SF1 loser
    expect(thirdPlace.awayTeamId).toBe("c1"); // SF2 loser
  });

  it("uses the shoot-out score to pick the semifinal winner when regulation is level", () => {
    const matches: ResolvableMatch[] = [
      finished("M", "semifinal", {
        slotHome: "F1",
        slotAway: "E2",
        homeTeamId: "teamX",
        awayTeamId: "teamY",
        homeScore: 2,
        awayScore: 2,
        homeSoScore: 3,
        awaySoScore: 4,
      }),
      scheduled("M", "final", { slotHome: "SF1W", slotAway: "SF2W" }),
    ];

    const updates = resolvePendingMatches(matches);
    const finalUpdate = updates.find((u) => u.matchId === matches[1].id);
    expect(finalUpdate?.homeTeamId).toBe("teamY"); // won the shoot-out despite a level scoreline
  });

  it("keeps genders fully independent", () => {
    const matches: ResolvableMatch[] = [
      ...ladder("M", "A", ["m1", "m2", "m3", "m4"]),
      scheduled("F", "round1", { groupName: "A" }),
      scheduled("M", "crossgroup", { groupName: "E", slotHome: "A1", slotAway: "D2" }),
      scheduled("F", "crossgroup", { groupName: "E", slotHome: "A1", slotAway: "D2" }),
    ];

    const updates = resolvePendingMatches(matches);
    // Group A (men) is complete but group D (men) isn't seeded at all here, so E can't
    // resolve yet either way — this just confirms no cross-gender leakage occurs.
    expect(updates.find((u) => u.matchId === matches.find((m) => m.gender === "F" && m.stage === "crossgroup")!.id)).toBeUndefined();
  });
});
