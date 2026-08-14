import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateHeading, formatTime } from "@/lib/format";
import { hasPassed } from "@/lib/time";
import { slotLabel } from "@/lib/tournament/labels";
import { teamColor, teamFlag, teamHasFlagEmoji } from "@/lib/team-codes";
import { GenderBadge } from "@/components/gender-badge";
import { SPECIAL_FLAGS } from "@/components/special-flags";
import { KNOCKOUT_STAGES } from "@/lib/types";
import { PredictionForm } from "./[id]/prediction-form";

const GENDER_FILTERS = [
  { value: undefined, label: "Tous" },
  { value: "M" as const, label: "Hommes" },
  { value: "F" as const, label: "Femmes" },
];

function MatchCardTeam({ name, slot }: { name: string | null; slot: string | null }) {
  const color = name ? teamColor(name) : null;
  const SpecialFlag = name ? SPECIAL_FLAGS[name] : undefined;
  const flag = !SpecialFlag && name ? teamFlag(name) : "❓";
  const isTextCode = !SpecialFlag && (!name || !teamHasFlagEmoji(name));
  return (
    <div className="match-card-team">
      <span
        className="team-swatch team-swatch-lg"
        style={{
          background: color ?? "var(--bg-subtle)",
          boxShadow: color ? `0 0 0 5px color-mix(in srgb, ${color} 18%, transparent)` : undefined,
        }}
      >
        {SpecialFlag ? (
          <SpecialFlag />
        ) : (
          <span className={isTextCode ? "team-flag-big team-flag-text" : "team-flag-big"}>{flag}</span>
        )}
      </span>
      <span className="match-card-team-name">{name ?? (slot ? slotLabel(slot) : "?")}</span>
    </div>
  );
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ gender?: string }>;
}) {
  const { supabase, user } = await requireUser();
  const { gender } = await searchParams;
  const activeGender = gender === "M" || gender === "F" ? gender : undefined;

  let query = supabase.from("matches").select("*").order("kickoff", { ascending: true });
  if (activeGender) query = query.eq("gender", activeGender);

  const [{ data: matches }, { data: teams }, { data: myPredictions }] = await Promise.all([
    query,
    supabase.from("teams").select("id, name"),
    supabase
      .from("predictions")
      .select("match_id, pred_home_score, pred_away_score, pred_shootout_winner")
      .eq("user_id", user.id),
  ]);

  const teamsById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const myPredictionByMatchId = new Map((myPredictions ?? []).map((p) => [p.match_id, p]));

  let lastHeading = "";

  return (
    <>
      <div className="page-header">
        <h1>Matchs</h1>
        <div className="pill-nav">
          {GENDER_FILTERS.map((f) => {
            const content = (
              <>
                {f.value && <GenderBadge gender={f.value} />}
                {f.label}
              </>
            );
            return activeGender === f.value ? (
              <strong key={f.label}>{content}</strong>
            ) : (
              <Link key={f.label} href={f.value ? `/matches?gender=${f.value}` : "/matches"}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {matches?.map((m) => {
        const heading = dateHeading(m.kickoff);
        const showHeading = heading !== lastHeading;
        lastHeading = heading;

        const homeName = teamsById.get(m.home_team_id ?? "") ?? null;
        const awayName = teamsById.get(m.away_team_id ?? "") ?? null;
        const existing = myPredictionByMatchId.get(m.id) ?? null;
        const isLocked = hasPassed(m.kickoff);
        const canPredict = m.home_team_id && m.away_team_id && !isLocked;

        return (
          <div key={m.id}>
            {showHeading && <div className="date-heading">{heading}</div>}

            <div className={`match-card match-card-${m.gender === "F" ? "f" : "m"}`}>
              <div className="match-card-meta">
                <GenderBadge gender={m.gender} />
                <span>
                  {formatTime(m.kickoff)}
                  {m.time_uncertain ? " ⚠" : ""}
                </span>
                <span>{m.placement_label ?? m.venue}</span>
                {m.status === "finished" && (
                  <span className="badge badge-accent" style={{ marginLeft: "auto" }}>
                    Terminé
                  </span>
                )}
              </div>

              <div className="match-card-body">
                <MatchCardTeam name={homeName} slot={m.slot_home} />

                <div className="match-card-center">
                  {m.status === "finished" ? (
                    <span className="match-card-final-score">
                      {m.home_score} – {m.away_score}
                    </span>
                  ) : canPredict ? (
                    <PredictionForm
                      matchId={m.id}
                      homeLabel={homeName ?? "?"}
                      awayLabel={awayName ?? "?"}
                      existing={existing}
                      isKnockout={KNOCKOUT_STAGES.includes(m.stage)}
                      compact
                    />
                  ) : existing ? (
                    <span className="match-card-final-score muted">
                      {existing.pred_home_score} – {existing.pred_away_score}
                    </span>
                  ) : (
                    <span className="score-vs">vs</span>
                  )}
                </div>

                <MatchCardTeam name={awayName} slot={m.slot_away} />
              </div>

              {(m.odds_home || m.odds_draw || m.odds_away) && (
                <div className="odds-row" style={{ justifyContent: "center", marginTop: "0.7rem" }}>
                  <span className="odds-pill">{m.odds_home ?? "–"}</span>
                  <span className="odds-pill">{m.odds_draw ?? "–"}</span>
                  <span className="odds-pill">{m.odds_away ?? "–"}</span>
                </div>
              )}

              {m.status === "finished" && (
                <div className="row" style={{ justifyContent: "center", marginTop: "0.6rem" }}>
                  <Link href={`/matches/${m.id}`} className="muted">
                    Voir le détail et les pronostics des autres →
                  </Link>
                </div>
              )}
              {!canPredict && m.status !== "finished" && existing && (
                <p className="muted" style={{ textAlign: "center", marginTop: "0.5rem", marginBottom: 0 }}>
                  Ton pronostic (verrouillé)
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
