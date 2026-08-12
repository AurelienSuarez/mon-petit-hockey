import type { Gender, Venue } from "./teams";

export type MatchStage = "round1" | "crossgroup" | "ranking" | "semifinal" | "third_place" | "final";

export type SeedParticipant = { team: string } | { slot: string };

export interface SeedMatch {
  stage: MatchStage;
  gender: Gender;
  /** 'A'-'D' for round1 pools, 'E'-'H' for crossgroup pools. */
  groupName?: string;
  home: SeedParticipant;
  away: SeedParticipant;
  /** ISO 8601, explicit +02:00 (CEST) offset per doc: "toutes les heures en CEST". */
  kickoff: string;
  venue: Venue;
  /** Flags kickoff times sourced from the doc's secondary source, marked '*' there. */
  timeUncertain?: boolean;
  placementLabel?: string;
}

const team = (name: string): SeedParticipant => ({ team: name });
const slot = (s: string): SeedParticipant => ({ slot: s });
const dt = (day: number, time: string): string => `2026-08-${String(day).padStart(2, "0")}T${time}:00+02:00`;

// --- Round1 (doc 1.3, "Premier tour", 15-20 August) -------------------------------

const ROUND1: SeedMatch[] = [
  // Sam 15 août
  { stage: "round1", gender: "F", groupName: "A", home: team("Australie"), away: team("Japon"), kickoff: dt(15, "10:00"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "B", home: team("Allemagne"), away: team("Écosse"), kickoff: dt(15, "11:30"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "D", home: team("Inde"), away: team("Pays de Galles"), kickoff: dt(15, "13:00"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "B", home: team("Allemagne"), away: team("Malaisie"), kickoff: dt(15, "14:30"), venue: "wavre" },
  { stage: "round1", gender: "F", groupName: "A", home: team("Pays-Bas"), away: team("Chili"), kickoff: dt(15, "16:00"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "B", home: team("Argentine"), away: team("États-Unis"), kickoff: dt(15, "17:30"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "D", home: team("Angleterre"), away: team("Pakistan"), kickoff: dt(15, "19:00"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "B", home: team("Belgique"), away: team("France"), kickoff: dt(15, "21:00"), venue: "wavre" },

  // Dim 16 août
  { stage: "round1", gender: "F", groupName: "D", home: team("Angleterre"), away: team("Afrique du Sud"), kickoff: dt(16, "10:00"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "C", home: team("Australie"), away: team("Irlande"), kickoff: dt(16, "11:30"), venue: "wavre" },
  { stage: "round1", gender: "F", groupName: "D", home: team("Chine"), away: team("Inde"), kickoff: dt(16, "13:00"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "C", home: team("Espagne"), away: team("Afrique du Sud"), kickoff: dt(16, "14:30"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "A", home: team("Pays-Bas"), away: team("Nouvelle-Zélande"), kickoff: dt(16, "16:00"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "C", home: team("Belgique"), away: team("Nouvelle-Zélande"), kickoff: dt(16, "17:30"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "A", home: team("Argentine"), away: team("Japon"), kickoff: dt(16, "19:00"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "C", home: team("Espagne"), away: team("Irlande"), kickoff: dt(16, "20:30"), venue: "wavre" },

  // Lun 17 août
  { stage: "round1", gender: "F", groupName: "A", home: team("Chili"), away: team("Japon"), kickoff: dt(17, "09:30"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "B", home: team("États-Unis"), away: team("Écosse"), kickoff: dt(17, "11:00"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "D", home: team("Pakistan"), away: team("Pays de Galles"), kickoff: dt(17, "12:30"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "B", home: team("France"), away: team("Malaisie"), kickoff: dt(17, "14:00"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "D", home: team("Inde"), away: team("Angleterre"), kickoff: dt(17, "15:00"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "B", home: team("Allemagne"), away: team("Argentine"), kickoff: dt(17, "17:00"), venue: "wavre" },
  { stage: "round1", gender: "F", groupName: "A", home: team("Australie"), away: team("Pays-Bas"), kickoff: dt(17, "18:00"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "B", home: team("Allemagne"), away: team("Belgique"), kickoff: dt(17, "20:30"), venue: "wavre" },

  // Mar 18 août
  { stage: "round1", gender: "M", groupName: "A", home: team("Nouvelle-Zélande"), away: team("Japon"), kickoff: dt(18, "09:30"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "C", home: team("Nouvelle-Zélande"), away: team("Irlande"), kickoff: dt(18, "11:00"), venue: "wavre" },
  { stage: "round1", gender: "F", groupName: "D", home: team("Angleterre"), away: team("Chine"), kickoff: dt(18, "12:00"), venue: "amstelveen", timeUncertain: true },
  { stage: "round1", gender: "M", groupName: "C", home: team("Espagne"), away: team("Australie"), kickoff: dt(18, "14:00"), venue: "wavre" },
  { stage: "round1", gender: "F", groupName: "D", home: team("Inde"), away: team("Afrique du Sud"), kickoff: dt(18, "15:00"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "C", home: team("Irlande"), away: team("Afrique du Sud"), kickoff: dt(18, "17:00"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "A", home: team("Argentine"), away: team("Pays-Bas"), kickoff: dt(18, "18:00"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "C", home: team("Espagne"), away: team("Belgique"), kickoff: dt(18, "20:30"), venue: "wavre" },

  // Mer 19 août
  { stage: "round1", gender: "F", groupName: "A", home: team("Chili"), away: team("Australie"), kickoff: dt(19, "09:30"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "B", home: team("Argentine"), away: team("Écosse"), kickoff: dt(19, "11:00"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "D", home: team("Angleterre"), away: team("Pays de Galles"), kickoff: dt(19, "12:30"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "B", home: team("États-Unis"), away: team("Allemagne"), kickoff: dt(19, "14:00"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "D", home: team("Pakistan"), away: team("Inde"), kickoff: dt(19, "15:00"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "B", home: team("France"), away: team("Allemagne"), kickoff: dt(19, "17:00"), venue: "wavre" },
  { stage: "round1", gender: "F", groupName: "A", home: team("Pays-Bas"), away: team("Japon"), kickoff: dt(19, "18:00"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "B", home: team("Belgique"), away: team("Malaisie"), kickoff: dt(19, "20:30"), venue: "wavre" },

  // Jeu 20 août
  { stage: "round1", gender: "F", groupName: "D", home: team("Chine"), away: team("Afrique du Sud"), kickoff: dt(20, "09:30"), venue: "amstelveen" },
  { stage: "round1", gender: "M", groupName: "C", home: team("Australie"), away: team("Afrique du Sud"), kickoff: dt(20, "11:00"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "A", home: team("Nouvelle-Zélande"), away: team("Argentine"), kickoff: dt(20, "12:30"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "C", home: team("Nouvelle-Zélande"), away: team("Espagne"), kickoff: dt(20, "14:00"), venue: "wavre" },
  { stage: "round1", gender: "F", groupName: "D", home: team("Inde"), away: team("Angleterre"), kickoff: dt(20, "15:00"), venue: "amstelveen", timeUncertain: true },
  { stage: "round1", gender: "M", groupName: "C", home: team("Irlande"), away: team("Espagne"), kickoff: dt(20, "17:00"), venue: "wavre" },
  { stage: "round1", gender: "M", groupName: "A", home: team("Pays-Bas"), away: team("Japon"), kickoff: dt(20, "18:00"), venue: "amstelveen" },
  { stage: "round1", gender: "F", groupName: "C", home: team("Belgique"), away: team("Irlande"), kickoff: dt(20, "20:30"), venue: "wavre" },
];

// --- Crossgroup (doc 1.3, "Poules croisées", 21-24 August) -------------------------
// Participants are round1 slots ('B3' = 3rd place of pool B); groupName is the
// crossgroup (E/F/G/H) this result feeds into.

const CROSSGROUP: SeedMatch[] = [
  // Ven 21 août — hommes à Wavre, femmes à Amstelveen
  { stage: "crossgroup", gender: "M", groupName: "H", home: slot("B3"), away: slot("C4"), kickoff: dt(21, "11:00"), venue: "wavre" },
  { stage: "crossgroup", gender: "F", groupName: "G", home: slot("D3"), away: slot("A4"), kickoff: dt(21, "12:30"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "M", groupName: "H", home: slot("C3"), away: slot("B4"), kickoff: dt(21, "14:00"), venue: "wavre" },
  { stage: "crossgroup", gender: "F", groupName: "G", home: slot("A3"), away: slot("D4"), kickoff: dt(21, "15:30"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "M", groupName: "F", home: slot("C1"), away: slot("B2"), kickoff: dt(21, "17:00"), venue: "wavre" },
  { stage: "crossgroup", gender: "F", groupName: "E", home: slot("D1"), away: slot("A2"), kickoff: dt(21, "18:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "M", groupName: "F", home: slot("B1"), away: slot("C2"), kickoff: dt(21, "20:30"), venue: "wavre" },
  { stage: "crossgroup", gender: "F", groupName: "E", home: slot("A1"), away: slot("D2"), kickoff: dt(21, "21:00"), venue: "amstelveen" },

  // Sam 22 août — femmes à Wavre, hommes à Amstelveen
  { stage: "crossgroup", gender: "M", groupName: "G", home: slot("A3"), away: slot("D4"), kickoff: dt(22, "10:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "F", groupName: "H", home: slot("C3"), away: slot("B4"), kickoff: dt(22, "11:30"), venue: "wavre" },
  { stage: "crossgroup", gender: "M", groupName: "G", home: slot("D3"), away: slot("A4"), kickoff: dt(22, "13:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "F", groupName: "H", home: slot("B3"), away: slot("C4"), kickoff: dt(22, "14:30"), venue: "wavre" },
  { stage: "crossgroup", gender: "M", groupName: "E", home: slot("A1"), away: slot("D2"), kickoff: dt(22, "16:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "F", groupName: "F", home: slot("C1"), away: slot("B2"), kickoff: dt(22, "17:30"), venue: "wavre" },
  { stage: "crossgroup", gender: "M", groupName: "E", home: slot("D1"), away: slot("A2"), kickoff: dt(22, "19:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "F", groupName: "F", home: slot("B1"), away: slot("C2"), kickoff: dt(22, "20:30"), venue: "wavre" },

  // Dim 23 août — hommes à Wavre, femmes à Amstelveen
  { stage: "crossgroup", gender: "M", groupName: "H", home: slot("B4"), away: slot("C4"), kickoff: dt(23, "11:30"), venue: "wavre" },
  { stage: "crossgroup", gender: "F", groupName: "G", home: slot("A4"), away: slot("D4"), kickoff: dt(23, "13:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "M", groupName: "H", home: slot("B3"), away: slot("C3"), kickoff: dt(23, "14:30"), venue: "wavre" },
  { stage: "crossgroup", gender: "F", groupName: "G", home: slot("A3"), away: slot("D3"), kickoff: dt(23, "16:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "M", groupName: "F", home: slot("B1"), away: slot("C1"), kickoff: dt(23, "17:30"), venue: "wavre" },
  { stage: "crossgroup", gender: "F", groupName: "E", home: slot("A1"), away: slot("D1"), kickoff: dt(23, "19:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "M", groupName: "F", home: slot("B2"), away: slot("C2"), kickoff: dt(23, "20:30"), venue: "wavre" },
  { stage: "crossgroup", gender: "F", groupName: "E", home: slot("A2"), away: slot("D2"), kickoff: dt(23, "22:00"), venue: "amstelveen", timeUncertain: true },

  // Lun 24 août — femmes à Wavre, hommes à Amstelveen
  { stage: "crossgroup", gender: "M", groupName: "G", home: slot("A4"), away: slot("D4"), kickoff: dt(24, "09:30"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "F", groupName: "H", home: slot("C4"), away: slot("B4"), kickoff: dt(24, "11:00"), venue: "wavre" },
  { stage: "crossgroup", gender: "M", groupName: "G", home: slot("A3"), away: slot("D3"), kickoff: dt(24, "12:30"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "F", groupName: "H", home: slot("C3"), away: slot("B3"), kickoff: dt(24, "14:00"), venue: "wavre" },
  { stage: "crossgroup", gender: "M", groupName: "E", home: slot("A2"), away: slot("D2"), kickoff: dt(24, "14:45"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "F", groupName: "F", home: slot("C2"), away: slot("B2"), kickoff: dt(24, "17:00"), venue: "wavre" },
  { stage: "crossgroup", gender: "M", groupName: "E", home: slot("A1"), away: slot("D1"), kickoff: dt(24, "18:00"), venue: "amstelveen" },
  { stage: "crossgroup", gender: "F", groupName: "F", home: slot("C1"), away: slot("B1"), kickoff: dt(24, "20:30"), venue: "wavre" },
];

// --- Ranking + semifinals (doc 1.3, 27-28 August) ----------------------------------
// SF1 = the F1-vs-E2 semifinal, SF2 = the E1-vs-F2 semifinal (see slots.ts) — a fixed
// internal label, independent of which gender kicks it off first on the day.

const RANKING_AND_SEMIS: SeedMatch[] = [
  // Jeu 27 août — journée féminine
  { stage: "ranking", gender: "F", home: slot("G4"), away: slot("H4"), kickoff: dt(27, "11:00"), venue: "wavre", placementLabel: "15e/16e" },
  { stage: "ranking", gender: "F", home: slot("G3"), away: slot("H3"), kickoff: dt(27, "12:30"), venue: "amstelveen", placementLabel: "13e/14e" },
  { stage: "ranking", gender: "F", home: slot("G1"), away: slot("H1"), kickoff: dt(27, "14:00"), venue: "wavre", placementLabel: "9e/10e" },
  { stage: "ranking", gender: "F", home: slot("G2"), away: slot("H2"), kickoff: dt(27, "15:30"), venue: "amstelveen", placementLabel: "11e/12e" },
  { stage: "ranking", gender: "F", home: slot("E4"), away: slot("F4"), kickoff: dt(27, "17:00"), venue: "wavre", placementLabel: "7e/8e" },
  { stage: "ranking", gender: "F", home: slot("E3"), away: slot("F3"), kickoff: dt(27, "18:00"), venue: "amstelveen", placementLabel: "5e/6e" },
  { stage: "semifinal", gender: "F", home: slot("F1"), away: slot("E2"), kickoff: dt(27, "20:30"), venue: "wavre", placementLabel: "Demi-finale (SF1)" },
  { stage: "semifinal", gender: "F", home: slot("E1"), away: slot("F2"), kickoff: dt(27, "21:00"), venue: "amstelveen", placementLabel: "Demi-finale (SF2)" },

  // Ven 28 août — journée masculine
  { stage: "ranking", gender: "M", home: slot("G3"), away: slot("H3"), kickoff: dt(28, "09:30"), venue: "amstelveen", placementLabel: "13e/14e" },
  { stage: "ranking", gender: "M", home: slot("G4"), away: slot("H4"), kickoff: dt(28, "11:00"), venue: "wavre", placementLabel: "15e/16e" },
  { stage: "ranking", gender: "M", home: slot("G2"), away: slot("H2"), kickoff: dt(28, "12:30"), venue: "amstelveen", placementLabel: "11e/12e" },
  { stage: "ranking", gender: "M", home: slot("G1"), away: slot("H1"), kickoff: dt(28, "14:00"), venue: "wavre", placementLabel: "9e/10e" },
  { stage: "ranking", gender: "M", home: slot("E3"), away: slot("F3"), kickoff: dt(28, "15:00"), venue: "amstelveen", placementLabel: "5e/6e" },
  { stage: "ranking", gender: "M", home: slot("E4"), away: slot("F4"), kickoff: dt(28, "17:00"), venue: "wavre", placementLabel: "7e/8e" },
  { stage: "semifinal", gender: "M", home: slot("E1"), away: slot("F2"), kickoff: dt(28, "18:00"), venue: "amstelveen", placementLabel: "Demi-finale (SF2)" },
  { stage: "semifinal", gender: "M", home: slot("F1"), away: slot("E2"), kickoff: dt(28, "20:30"), venue: "wavre", placementLabel: "Demi-finale (SF1)" },
];

// --- Finals (doc 1.3, 29-30 August) -------------------------------------------------
// The doc names these without spelling out a slot pairing; SF1 vs SF2 winners/losers
// is this seed's own (documented, reasonable) convention — see slots.ts.

const FINALS: SeedMatch[] = [
  { stage: "third_place", gender: "F", home: slot("SF1L"), away: slot("SF2L"), kickoff: dt(29, "16:00"), venue: "amstelveen", placementLabel: "Petite finale" },
  { stage: "final", gender: "F", home: slot("SF1W"), away: slot("SF2W"), kickoff: dt(29, "19:00"), venue: "amstelveen", placementLabel: "Finale" },
  { stage: "third_place", gender: "M", home: slot("SF1L"), away: slot("SF2L"), kickoff: dt(30, "14:00"), venue: "wavre", placementLabel: "Petite finale" },
  { stage: "final", gender: "M", home: slot("SF1W"), away: slot("SF2W"), kickoff: dt(30, "16:30"), venue: "wavre", placementLabel: "Finale" },
];

export const SEED_MATCHES: SeedMatch[] = [...ROUND1, ...CROSSGROUP, ...RANKING_AND_SEMIS, ...FINALS];
