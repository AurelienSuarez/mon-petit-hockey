/**
 * FIH's own results feed reports team names in English; this app's teams table uses
 * French names (see supabase/seed/teams.ts). Fixed list — the 2026 World Cup fields
 * are locked at 16 teams per gender and don't change mid-tournament.
 */
export const FIH_TEAM_NAME_TO_FRENCH: Record<string, string> = {
  Netherlands: "Pays-Bas",
  Argentina: "Argentine",
  Japan: "Japon",
  "New Zealand": "Nouvelle-Zélande",
  Belgium: "Belgique",
  Germany: "Allemagne",
  France: "France",
  Malaysia: "Malaisie",
  Australia: "Australie",
  Spain: "Espagne",
  Ireland: "Irlande",
  "South Africa": "Afrique du Sud",
  England: "Angleterre",
  India: "Inde",
  Pakistan: "Pakistan",
  Wales: "Pays de Galles",
  Chile: "Chili",
  Scotland: "Écosse",
  "United States": "États-Unis",
  China: "Chine",
};
