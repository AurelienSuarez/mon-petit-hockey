import { describe, expect, it } from "vitest";
import { SEED_TEAMS } from "./teams";
import { SEED_MATCHES } from "./matches";

describe("seed data integrity", () => {
  it("has exactly 32 teams (16 men + 16 women)", () => {
    expect(SEED_TEAMS.length).toBe(32);
    expect(SEED_TEAMS.filter((t) => t.gender === "M").length).toBe(16);
    expect(SEED_TEAMS.filter((t) => t.gender === "F").length).toBe(16);
  });

  it("has no duplicate (name, gender) team pairs", () => {
    const keys = SEED_TEAMS.map((t) => `${t.name}|${t.gender}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has exactly 4 teams per round1 group per gender", () => {
    for (const gender of ["M", "F"] as const) {
      for (const group of ["A", "B", "C", "D"] as const) {
        const count = SEED_TEAMS.filter((t) => t.gender === gender && t.round1Group === group).length;
        expect(count).toBe(4);
      }
    }
  });

  it("has exactly 100 matches (doc: 100 matchs, 50 hommes, 50 femmes)", () => {
    expect(SEED_MATCHES.length).toBe(100);
    expect(SEED_MATCHES.filter((m) => m.gender === "M").length).toBe(50);
    expect(SEED_MATCHES.filter((m) => m.gender === "F").length).toBe(50);
  });

  it("has the expected match count per stage", () => {
    const byStage = (stage: string) => SEED_MATCHES.filter((m) => m.stage === stage).length;
    expect(byStage("round1")).toBe(48);
    expect(byStage("crossgroup")).toBe(32);
    expect(byStage("ranking")).toBe(12);
    expect(byStage("semifinal")).toBe(4);
    expect(byStage("third_place")).toBe(2);
    expect(byStage("final")).toBe(2);
  });

  it("gives every round1 team exactly 3 round1 matches", () => {
    const round1 = SEED_MATCHES.filter((m) => m.stage === "round1");
    const counts = new Map<string, number>();
    for (const m of round1) {
      for (const p of [m.home, m.away]) {
        if ("team" in p) {
          const key = `${p.team}|${m.gender}`;
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
    }
    expect(counts.size).toBe(32);
    for (const [key, count] of counts) {
      expect(count, `${key} should play exactly 3 round1 matches`).toBe(3);
    }
  });

  it("references only round1-slot or SF-knockout-slot participants beyond round1", () => {
    const groupSlotPattern = /^[A-Z][1-4]$/;
    const knockoutSlotPattern = /^SF[12][WL]$/;
    for (const m of SEED_MATCHES) {
      if (m.stage === "round1") continue;
      for (const p of [m.home, m.away]) {
        expect("slot" in p, `expected a slot participant in stage ${m.stage}`).toBe(true);
        if ("slot" in p) {
          const valid = groupSlotPattern.test(p.slot) || knockoutSlotPattern.test(p.slot);
          expect(valid, `unexpected slot format: ${p.slot}`).toBe(true);
        }
      }
    }
  });

  it("gives every crossgroup 4 new matches per gender, each involved team playing exactly 2", () => {
    for (const gender of ["M", "F"] as const) {
      for (const group of ["E", "F", "G", "H"] as const) {
        const matches = SEED_MATCHES.filter(
          (m) => m.stage === "crossgroup" && m.gender === gender && m.groupName === group,
        );
        expect(matches.length, `${group}/${gender}`).toBe(4);

        const counts = new Map<string, number>();
        for (const m of matches) {
          for (const p of [m.home, m.away]) {
            if ("slot" in p) counts.set(p.slot, (counts.get(p.slot) ?? 0) + 1);
          }
        }
        expect(counts.size, `${group}/${gender} should involve 4 distinct slots`).toBe(4);
        for (const [key, count] of counts) {
          expect(count, `${group}/${gender} slot ${key}`).toBe(2);
        }
      }
    }
  });

  it("flags exactly the 3 kickoff times the doc itself calls uncertain", () => {
    const uncertain = SEED_MATCHES.filter((m) => m.timeUncertain);
    expect(uncertain.length).toBe(3);
  });
});
