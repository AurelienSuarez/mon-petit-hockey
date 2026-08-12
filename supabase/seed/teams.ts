export type Gender = "M" | "F";
export type Round1Group = "A" | "B" | "C" | "D";
export type Venue = "wavre" | "amstelveen";

export interface SeedTeam {
  name: string;
  gender: Gender;
  round1Group: Round1Group;
  site: Venue;
  /**
   * Rough starting Elo, tiered from general knowledge of recent FIH world rankings
   * (doc 3.1 notes there's no documented public FIH API to pull exact points from).
   * This is an intentionally approximate prior — adjust via the admin page once real
   * results start narrowing things down; it only sets the very first odds, and every
   * match played moves ratings away from it.
   */
  initialElo: number;
}

// Doc 1.1 — men's pools.
const MEN: SeedTeam[] = [
  { name: "Pays-Bas", gender: "M", round1Group: "A", site: "amstelveen", initialElo: 1650 },
  { name: "Argentine", gender: "M", round1Group: "A", site: "amstelveen", initialElo: 1580 },
  { name: "Japon", gender: "M", round1Group: "A", site: "amstelveen", initialElo: 1440 },
  { name: "Nouvelle-Zélande", gender: "M", round1Group: "A", site: "amstelveen", initialElo: 1470 },

  { name: "Belgique", gender: "M", round1Group: "B", site: "wavre", initialElo: 1640 },
  { name: "Allemagne", gender: "M", round1Group: "B", site: "wavre", initialElo: 1600 },
  { name: "France", gender: "M", round1Group: "B", site: "wavre", initialElo: 1480 },
  { name: "Malaisie", gender: "M", round1Group: "B", site: "wavre", initialElo: 1370 },

  { name: "Australie", gender: "M", round1Group: "C", site: "wavre", initialElo: 1590 },
  { name: "Espagne", gender: "M", round1Group: "C", site: "wavre", initialElo: 1530 },
  { name: "Irlande", gender: "M", round1Group: "C", site: "wavre", initialElo: 1490 },
  { name: "Afrique du Sud", gender: "M", round1Group: "C", site: "wavre", initialElo: 1450 },

  { name: "Angleterre", gender: "M", round1Group: "D", site: "amstelveen", initialElo: 1540 },
  { name: "Inde", gender: "M", round1Group: "D", site: "amstelveen", initialElo: 1570 },
  { name: "Pakistan", gender: "M", round1Group: "D", site: "amstelveen", initialElo: 1430 },
  { name: "Pays de Galles", gender: "M", round1Group: "D", site: "amstelveen", initialElo: 1380 },
];

// Doc 1.1 — women's pools.
const WOMEN: SeedTeam[] = [
  { name: "Pays-Bas", gender: "F", round1Group: "A", site: "amstelveen", initialElo: 1660 },
  { name: "Australie", gender: "F", round1Group: "A", site: "amstelveen", initialElo: 1590 },
  { name: "Chili", gender: "F", round1Group: "A", site: "amstelveen", initialElo: 1380 },
  { name: "Japon", gender: "F", round1Group: "A", site: "amstelveen", initialElo: 1450 },

  { name: "Argentine", gender: "F", round1Group: "B", site: "wavre", initialElo: 1580 },
  { name: "Allemagne", gender: "F", round1Group: "B", site: "wavre", initialElo: 1560 },
  { name: "Écosse", gender: "F", round1Group: "B", site: "wavre", initialElo: 1420 },
  { name: "États-Unis", gender: "F", round1Group: "B", site: "wavre", initialElo: 1460 },

  { name: "Belgique", gender: "F", round1Group: "C", site: "wavre", initialElo: 1520 },
  { name: "Espagne", gender: "F", round1Group: "C", site: "wavre", initialElo: 1490 },
  { name: "Irlande", gender: "F", round1Group: "C", site: "wavre", initialElo: 1470 },
  { name: "Nouvelle-Zélande", gender: "F", round1Group: "C", site: "wavre", initialElo: 1480 },

  { name: "Chine", gender: "F", round1Group: "D", site: "amstelveen", initialElo: 1500 },
  { name: "Angleterre", gender: "F", round1Group: "D", site: "amstelveen", initialElo: 1550 },
  { name: "Inde", gender: "F", round1Group: "D", site: "amstelveen", initialElo: 1460 },
  { name: "Afrique du Sud", gender: "F", round1Group: "D", site: "amstelveen", initialElo: 1440 },
];

export const SEED_TEAMS: SeedTeam[] = [...MEN, ...WOMEN];
