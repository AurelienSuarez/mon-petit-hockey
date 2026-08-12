import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dateHeading, formatTime } from "@/lib/format";
import { TeamLabel } from "@/components/team-label";

const GENDER_FILTERS = [
  { value: undefined, label: "Tous" },
  { value: "M", label: "♂ Hommes" },
  { value: "F", label: "♀ Femmes" },
] as const;

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
    supabase.from("predictions").select("match_id").eq("user_id", user.id),
  ]);

  const teamsById = new Map((teams ?? []).map((t) => [t.id, t.name]));
  const predictedMatchIds = new Set((myPredictions ?? []).map((p) => p.match_id));

  let lastHeading = "";

  return (
    <>
      <div className="page-header">
        <h1>Matchs</h1>
        <div className="pill-nav">
          {GENDER_FILTERS.map((f) =>
            activeGender === f.value ? (
              <strong key={f.label}>{f.label}</strong>
            ) : (
              <Link key={f.label} href={f.value ? `/matches?gender=${f.value}` : "/matches"}>
                {f.label}
              </Link>
            ),
          )}
        </div>
      </div>

      {matches?.map((m) => {
        const heading = dateHeading(m.kickoff);
        const showHeading = heading !== lastHeading;
        lastHeading = heading;
        const predicted = predictedMatchIds.has(m.id);

        return (
          <div key={m.id}>
            {showHeading && <div className="date-heading">{heading}</div>}
            <div className="match-row">
              <div>
                <div className="match-teams">
                  <TeamLabel name={teamsById.get(m.home_team_id ?? "") ?? null} slot={m.slot_home} />
                  <span className="score-vs">vs</span>
                  <TeamLabel name={teamsById.get(m.away_team_id ?? "") ?? null} slot={m.slot_away} />
                </div>
                <div className="match-meta row">
                  <span>
                    {formatTime(m.kickoff)}
                    {m.time_uncertain ? " ⚠" : ""}
                  </span>
                  <span className={`badge ${m.gender === "F" ? "badge-f" : "badge-m"}`}>
                    {m.gender === "F" ? "♀" : "♂"} {m.placement_label ?? m.venue}
                  </span>
                  {m.status === "finished" && (
                    <span className="badge badge-accent">
                      {m.home_score} – {m.away_score}
                    </span>
                  )}
                </div>
              </div>
              <div className="stack" style={{ alignItems: "flex-end", gap: "0.4rem" }}>
                <div className="odds-row">
                  <span className="odds-pill">{m.odds_home ?? "–"}</span>
                  <span className="odds-pill">{m.odds_draw ?? "–"}</span>
                  <span className="odds-pill">{m.odds_away ?? "–"}</span>
                </div>
                <Link href={`/matches/${m.id}`} className={`btn btn-sm${predicted ? " btn-secondary" : ""}`}>
                  {m.status === "finished" ? "Résultat" : predicted ? "✓ Pronostiqué" : "Pronostiquer"}
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
