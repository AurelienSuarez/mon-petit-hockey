/**
 * Match kickoffs are always meant to display in the tournament's own local time
 * (doc: "toutes les heures en CEST = heure de Paris"). Without an explicit timeZone,
 * `toLocaleString` falls back to the *runtime's* zone — Windows dev machines default
 * to the system's local zone, but Cloudflare Workers (workerd) defaults to UTC, so the
 * same match would render 2 hours apart between local dev and production. Pinning the
 * zone here keeps it identical everywhere.
 */
const TOURNAMENT_TIME_ZONE = "Europe/Paris";

export function formatKickoff(iso: string, dateStyle: "short" | "full" = "short"): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle, timeStyle: "short", timeZone: TOURNAMENT_TIME_ZONE });
}
