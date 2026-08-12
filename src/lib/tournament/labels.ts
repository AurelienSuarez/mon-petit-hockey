/** Human-readable French label for a slot that hasn't resolved to a team yet. */
export function slotLabel(slot: string): string {
  const knockout = /^SF([12])([WL])$/.exec(slot);
  if (knockout) {
    const [, n, outcome] = knockout;
    return outcome === "W" ? `Vainqueur demi-finale ${n}` : `Perdant demi-finale ${n}`;
  }

  const group = /^([A-Z])([1-4])$/.exec(slot);
  if (group) {
    const [, letter, rank] = group;
    return `${rank}${rank === "1" ? "er" : "e"} groupe ${letter}`;
  }

  return slot;
}
