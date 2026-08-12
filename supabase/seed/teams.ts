export type Gender = "M" | "F";
export type Round1Group = "A" | "B" | "C" | "D";
export type Venue = "wavre" | "amstelveen";

export interface SeedTeam {
  name: string;
  gender: Gender;
  round1Group: Round1Group;
  site: Venue;
  /** Real FIH World Ranking points — see FIH_RANKING_SOURCE below. */
  fihPoints: number;
  /** Derived from fihPoints via eloFromFihPoints() — see that function for the formula. */
  initialElo: number;
}

export const FIH_RANKING_SOURCE =
  "FIH Men's/Women's World Ranking, retrieved 2026-08-12 " +
  "(en.wikipedia.org/wiki/FIH_Men's_World_Ranking, en.wikipedia.org/wiki/FIH_Women's_World_Ranking; " +
  "men's table dated 2026-08-05, women's dated 2026-08-04) — the doc this app is built from notes there's " +
  "no documented public FIH API, so this is the best available public snapshot.";

/**
 * FIH ranking points and this app's Elo aren't the same scale or update mechanism, so
 * points are linearly rescaled per gender: centered on 1500 (this app's Elo baseline),
 * spread by a factor of 0.3 per ranking-point of gap from the field's mean. Men and
 * women share the same 0.3 factor deliberately — it's not re-fit per field, since a
 * ranking-point gap should mean the same thing regardless of which tour it's on. Only
 * relative gaps within a gender matter for this app's odds (men never play women).
 */
function eloFromFihPoints(pointsByGender: SeedTeamInput[]): Map<string, number> {
  const mean = pointsByGender.reduce((sum, t) => sum + t.fihPoints, 0) / pointsByGender.length;
  const SCALE = 0.3;
  return new Map(pointsByGender.map((t) => [t.name, Math.round(1500 + (t.fihPoints - mean) * SCALE)]));
}

interface SeedTeamInput {
  name: string;
  gender: Gender;
  round1Group: Round1Group;
  site: Venue;
  fihPoints: number;
}

// Doc 1.1 pools + FIH Men's World Ranking points (as of 2026-08-05).
const MEN_INPUT: SeedTeamInput[] = [
  { name: "Pays-Bas", gender: "M", round1Group: "A", site: "amstelveen", fihPoints: 3613.06 },
  { name: "Argentine", gender: "M", round1Group: "A", site: "amstelveen", fihPoints: 3264.51 },
  { name: "Japon", gender: "M", round1Group: "A", site: "amstelveen", fihPoints: 2411.96 },
  { name: "Nouvelle-Zélande", gender: "M", round1Group: "A", site: "amstelveen", fihPoints: 2736.73 },

  { name: "Belgique", gender: "M", round1Group: "B", site: "wavre", fihPoints: 3838.25 },
  { name: "Allemagne", gender: "M", round1Group: "B", site: "wavre", fihPoints: 3406.2 },
  { name: "France", gender: "M", round1Group: "B", site: "wavre", fihPoints: 2795.56 },
  { name: "Malaisie", gender: "M", round1Group: "B", site: "wavre", fihPoints: 2451.93 },

  { name: "Australie", gender: "M", round1Group: "C", site: "wavre", fihPoints: 3494.67 },
  { name: "Espagne", gender: "M", round1Group: "C", site: "wavre", fihPoints: 3296.83 },
  { name: "Irlande", gender: "M", round1Group: "C", site: "wavre", fihPoints: 2795.27 },
  { name: "Afrique du Sud", gender: "M", round1Group: "C", site: "wavre", fihPoints: 2541.82 },

  { name: "Angleterre", gender: "M", round1Group: "D", site: "amstelveen", fihPoints: 3599.34 },
  { name: "Inde", gender: "M", round1Group: "D", site: "amstelveen", fihPoints: 3233.64 },
  { name: "Pakistan", gender: "M", round1Group: "D", site: "amstelveen", fihPoints: 2549.86 },
  { name: "Pays de Galles", gender: "M", round1Group: "D", site: "amstelveen", fihPoints: 2428.82 },
];

// Doc 1.1 pools + FIH Women's World Ranking points (as of 2026-08-04).
const WOMEN_INPUT: SeedTeamInput[] = [
  { name: "Pays-Bas", gender: "F", round1Group: "A", site: "amstelveen", fihPoints: 4103.99 },
  { name: "Australie", gender: "F", round1Group: "A", site: "amstelveen", fihPoints: 2833.56 },
  { name: "Chili", gender: "F", round1Group: "A", site: "amstelveen", fihPoints: 2469.67 },
  { name: "Japon", gender: "F", round1Group: "A", site: "amstelveen", fihPoints: 2357.79 },

  { name: "Argentine", gender: "F", round1Group: "B", site: "wavre", fihPoints: 3573.42 },
  { name: "Allemagne", gender: "F", round1Group: "B", site: "wavre", fihPoints: 3163.12 },
  { name: "Écosse", gender: "F", round1Group: "B", site: "wavre", fihPoints: 2407.56 },
  { name: "États-Unis", gender: "F", round1Group: "B", site: "wavre", fihPoints: 2566.43 },

  { name: "Belgique", gender: "F", round1Group: "C", site: "wavre", fihPoints: 3369.8 },
  { name: "Espagne", gender: "F", round1Group: "C", site: "wavre", fihPoints: 3103.8 },
  { name: "Irlande", gender: "F", round1Group: "C", site: "wavre", fihPoints: 2502.29 },
  { name: "Nouvelle-Zélande", gender: "F", round1Group: "C", site: "wavre", fihPoints: 2631 },

  { name: "Chine", gender: "F", round1Group: "D", site: "amstelveen", fihPoints: 3211.05 },
  { name: "Angleterre", gender: "F", round1Group: "D", site: "amstelveen", fihPoints: 2957.83 },
  { name: "Inde", gender: "F", round1Group: "D", site: "amstelveen", fihPoints: 2735.06 },
  { name: "Afrique du Sud", gender: "F", round1Group: "D", site: "amstelveen", fihPoints: 2013.71 },
];

const menElo = eloFromFihPoints(MEN_INPUT);
const womenElo = eloFromFihPoints(WOMEN_INPUT);

export const SEED_TEAMS: SeedTeam[] = [
  ...MEN_INPUT.map((t) => ({ ...t, initialElo: menElo.get(t.name)! })),
  ...WOMEN_INPUT.map((t) => ({ ...t, initialElo: womenElo.get(t.name)! })),
];
