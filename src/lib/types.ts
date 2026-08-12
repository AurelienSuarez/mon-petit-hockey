export type Gender = "M" | "F";

export type Venue = "wavre" | "amstelveen";

/**
 * round1: original 4-team pools (A-D).
 * crossgroup: E/F/G/H pools formed from round1 rankings, 21-24 Aug.
 * ranking: 5th-16th placement matches, 27-28 Aug.
 * semifinal / third_place / final: knockout, no draws (shoot-out decides).
 */
export type MatchStage =
  | "round1"
  | "crossgroup"
  | "ranking"
  | "semifinal"
  | "third_place"
  | "final";

export const KNOCKOUT_STAGES: readonly MatchStage[] = ["semifinal", "third_place", "final"];

export function stageAllowsDraw(stage: MatchStage): boolean {
  return !KNOCKOUT_STAGES.includes(stage);
}

export type Round1Group = "A" | "B" | "C" | "D";
export type CrossGroup = "E" | "F" | "G" | "H";
