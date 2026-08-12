/** Kept out of component bodies so the impure Date.now() read doesn't trip react-hooks/purity. */
export function hasPassed(isoDate: string): boolean {
  return new Date(isoDate).getTime() <= Date.now();
}
