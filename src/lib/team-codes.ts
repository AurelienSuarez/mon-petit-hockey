/**
 * No crest/flag image assets in this app — a 3-letter code + a color derived from the
 * name stands in for a team logo. The code table is hand-picked (IOC-style) for the
 * exact 32 seeded teams; the color is a deterministic hash so it's stable without
 * having to hand-pick 20 colors too.
 */
const TEAM_CODES: Record<string, string> = {
  "Pays-Bas": "NED",
  Argentine: "ARG",
  Japon: "JPN",
  "Nouvelle-Zélande": "NZL",
  Belgique: "BEL",
  Allemagne: "GER",
  France: "FRA",
  Malaisie: "MAS",
  Australie: "AUS",
  Espagne: "ESP",
  Irlande: "IRL",
  "Afrique du Sud": "RSA",
  Angleterre: "ENG",
  Inde: "IND",
  Pakistan: "PAK",
  "Pays de Galles": "WAL",
  Chili: "CHI",
  Écosse: "SCO",
  "États-Unis": "USA",
  Chine: "CHN",
};

export function teamCode(name: string): string {
  return TEAM_CODES[name] ?? name.slice(0, 3).toUpperCase();
}

export function teamColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 55% 42%)`;
}
