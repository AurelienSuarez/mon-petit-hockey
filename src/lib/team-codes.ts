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
  return `hsl(${hue} 68% 45%)`;
}

const TEAM_ISO: Record<string, string> = {
  "Pays-Bas": "NL",
  Argentine: "AR",
  Japon: "JP",
  "Nouvelle-Zélande": "NZ",
  Belgique: "BE",
  Allemagne: "DE",
  France: "FR",
  Malaisie: "MY",
  Australie: "AU",
  Espagne: "ES",
  Irlande: "IE",
  "Afrique du Sud": "ZA",
  Inde: "IN",
  Pakistan: "PK",
  Chili: "CL",
  "États-Unis": "US",
  Chine: "CN",
};

function flagFromIsoCode(code: string): string {
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/**
 * England/Scotland/Wales have no ISO 3166-1 code, so no regional-indicator flag either
 * — their real flag emoji is a "tag sequence" with much patchier font support (renders
 * as a broken black-flag glyph on plenty of devices, worse than the plain-letter
 * fallback every other team gets when a flag *isn't* supported). Falling back straight
 * to the team code for these three keeps every badge equally readable instead of
 * gambling on tag-sequence support.
 */
export function teamFlag(name: string): string {
  const iso = TEAM_ISO[name];
  if (iso) return flagFromIsoCode(iso);
  return TEAM_CODES[name] ?? "🏳️";
}

/**
 * Whether teamFlag() returns a real pictorial flag (regional-indicator emoji) rather
 * than a plain-text code fallback — callers need this to size the two differently, and
 * can't infer it from the returned string's .length: a flag built from two regional
 * indicators is 4 UTF-16 code units (each is a surrogate pair), same order of
 * magnitude as a 3-letter code string.
 */
export function teamHasFlagEmoji(name: string): boolean {
  return name in TEAM_ISO;
}
