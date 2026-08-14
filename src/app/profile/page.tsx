import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { GenderBadge } from "@/components/gender-badge";
import { ShareProfileButton, type ShareStat } from "./share-button";

const RANK_CLASS: Record<number, string> = { 1: "gold", 2: "silver", 3: "bronze" };
const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function GenderStandings({
  gender,
  points,
  standings,
  userId,
}: {
  gender: "M" | "F";
  points: number;
  standings: { user_id: string; username: string; total_points: number }[];
  userId: string;
}) {
  const rank = standings.findIndex((row) => row.user_id === userId) + 1;

  return (
    <div className="card stack" style={{ gap: "0.6rem" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className={`badge ${gender === "F" ? "badge-f" : "badge-m"}`}>
          <GenderBadge gender={gender} /> Coupe du monde {gender === "F" ? "Femmes" : "Hommes"}
        </span>
        <span className="points">
          {points} pts{rank > 0 ? ` · ${rank}${rank === 1 ? "er" : "e"} sur ${standings.length}` : ""}
        </span>
      </div>

      <div className="stack" style={{ gap: "0.15rem" }}>
        {standings.map((row, i) => {
          const position = i + 1;
          const isMe = row.user_id === userId;
          return (
            <div className={`leaderboard-row${isMe ? " me" : ""}`} key={row.user_id}>
              <span className={`rank ${RANK_CLASS[position] ?? ""}`}>{position}</span>
              <span className="avatar">{row.username.slice(0, 2).toUpperCase()}</span>
              <span>
                {row.username}
                {isMe && <span className="muted"> (toi)</span>}
              </span>
              <span className="points">{row.total_points} pts</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: scores }, { data: standingsM }, { data: standingsF }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).single(),
    supabase.rpc("my_scores"),
    supabase.rpc("global_standings", { p_gender: "M" }),
    supabase.rpc("global_standings", { p_gender: "F" }),
  ]);

  const totals = { M: 0, F: 0 };
  for (const row of scores ?? []) totals[row.gender] = row.total_points;

  const rankM = (standingsM ?? []).findIndex((row) => row.user_id === user.id) + 1;
  const rankF = (standingsF ?? []).findIndex((row) => row.user_id === user.id) + 1;
  const username = profile?.username ?? "";

  const shareStats: ShareStat[] = [
    { gender: "M" as const, points: totals.M, rank: rankM, total: standingsM?.length ?? 0 },
    { gender: "F" as const, points: totals.F, rank: rankF, total: standingsF?.length ?? 0 },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Mon profil</h1>
      </div>

      <div className="player-card">
        <div className="player-card-brand">🏑 Mon Petit Hockey</div>
        <div className="player-card-avatar">{username.slice(0, 2).toUpperCase()}</div>
        <div className="player-card-username">{username}</div>

        <div className="player-card-stats">
          <div className="player-card-stat">
            <span className="player-card-stat-label">
              <GenderBadge gender="M" /> Hommes
            </span>
            <span className="player-card-stat-value">
              {MEDAL[rankM] ?? ""} {totals.M} pts
            </span>
            {rankM > 0 && <span className="player-card-stat-rank">{rankM}e / {standingsM?.length}</span>}
          </div>
          <div className="player-card-stat">
            <span className="player-card-stat-label">
              <GenderBadge gender="F" /> Femmes
            </span>
            <span className="player-card-stat-value">
              {MEDAL[rankF] ?? ""} {totals.F} pts
            </span>
            {rankF > 0 && <span className="player-card-stat-rank">{rankF}e / {standingsF?.length}</span>}
          </div>
        </div>

        <ShareProfileButton username={username} stats={shareStats} />
      </div>

      <h2>Classement général</h2>
      <div className="stack">
        <GenderStandings gender="M" points={totals.M} standings={standingsM ?? []} userId={user.id} />
        <GenderStandings gender="F" points={totals.F} standings={standingsF ?? []} userId={user.id} />
      </div>

      <form action={logoutAction} style={{ marginTop: "1.5rem" }}>
        <button type="submit" className="btn-secondary btn-sm">
          Déconnexion
        </button>
      </form>
    </>
  );
}
