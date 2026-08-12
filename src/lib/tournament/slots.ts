import type { TeamStanding } from "./standings";

/**
 * A slot references a rank within a group that may not be fully decided yet, e.g.
 * "A1" = winner of round1 pool A, "G3" = 3rd place in crossgroup G. Used for every
 * match beyond round1, whose participants are only known once earlier standings
 * settle. This single notation covers round1 -> crossgroup, crossgroup -> ranking/
 * semifinal, and semifinal -> final resolution — no per-stage special-casing needed.
 */
const SLOT_PATTERN = /^([A-Z])([1-4])$/;

export interface ParsedSlot {
  group: string;
  rank: number;
}

export function parseSlot(slot: string): ParsedSlot {
  const match = SLOT_PATTERN.exec(slot);
  if (!match) throw new Error(`Invalid slot format: ${slot}`);
  return { group: match[1], rank: Number(match[2]) };
}

/**
 * Fixed mapping from the reference doc (1.2): crossgroup E/F/G/H is built from the
 * round1 rank range of two specific pools. The Wavre/Amstelveen split (doc: "une
 * équipe basée à Wavre ne peut rencontrer une équipe basée à Amstelveen qu'en
 * demi-finale ou en finale") falls out naturally because A/D are the Amstelveen
 * pools and B/C are the Wavre pools.
 */
export const CROSSGROUP_SOURCE: Record<string, { ranks: [number, number]; groups: [string, string] }> = {
  E: { ranks: [1, 2], groups: ["A", "D"] },
  F: { ranks: [1, 2], groups: ["B", "C"] },
  G: { ranks: [3, 4], groups: ["A", "D"] },
  H: { ranks: [3, 4], groups: ["B", "C"] },
};

/** Resolves the 4 team ids that make up a crossgroup, given final round1 standings per pool. */
export function crossGroupTeamIds(
  crossGroup: keyof typeof CROSSGROUP_SOURCE,
  round1StandingsByGroup: Record<string, TeamStanding[]>,
): string[] {
  const { ranks, groups } = CROSSGROUP_SOURCE[crossGroup];
  const [rankA, rankB] = ranks;

  return groups.flatMap((group) => {
    const standings = round1StandingsByGroup[group];
    if (!standings) throw new Error(`Missing round1 standings for group ${group}`);
    const a = standings[rankA - 1];
    const b = standings[rankB - 1];
    if (!a || !b) throw new Error(`Group ${group} standings incomplete for crossgroup ${crossGroup}`);
    return [a.teamId, b.teamId];
  });
}

/**
 * The third-place playoff and final aren't ranked within a group — they reference the
 * winner/loser of a specific semifinal. By convention (fixed regardless of kickoff
 * order, which differs between the men's and women's day): SF1 = the F1-vs-E2
 * semifinal, SF2 = the E1-vs-F2 semifinal (doc 1.3's own pairing). The doc doesn't
 * spell out which semifinal feeds which side of the final/third-place match, so this
 * seed data pairs them by semifinal number (SF1 vs SF2 on both sides) as a documented,
 * reasonable default.
 */
export type SemifinalKey = "SF1" | "SF2";

export interface SemifinalOutcome {
  winnerTeamId: string;
  loserTeamId: string;
}

const KNOCKOUT_SLOT_PATTERN = /^(SF[12])([WL])$/;

export function isKnockoutSlot(slot: string): boolean {
  return KNOCKOUT_SLOT_PATTERN.test(slot);
}

export interface SlotResolutionContext {
  standingsByGroup: Record<string, TeamStanding[]>;
  semifinalOutcomes?: Partial<Record<SemifinalKey, SemifinalOutcome>>;
}

/** Resolves a single slot (group rank, or semifinal winner/loser) to a team id, if known yet. */
export function resolveSlot(slot: string, context: SlotResolutionContext): string | undefined {
  const knockoutMatch = KNOCKOUT_SLOT_PATTERN.exec(slot);
  if (knockoutMatch) {
    const [, key, outcome] = knockoutMatch;
    const result = context.semifinalOutcomes?.[key as SemifinalKey];
    if (!result) return undefined;
    return outcome === "W" ? result.winnerTeamId : result.loserTeamId;
  }

  const { group, rank } = parseSlot(slot);
  return context.standingsByGroup[group]?.[rank - 1]?.teamId;
}
