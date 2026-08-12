import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";

const RANK_CLASS: Record<number, string> = { 1: "gold", 2: "silver", 3: "bronze" };

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, invite_code, owner_id, gender")
    .eq("id", id)
    .single();

  if (!league) notFound();

  const { data: standings } = await supabase.rpc("league_standings", { p_league_id: id });

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{league.name}</h1>
          <div className="row" style={{ marginTop: "0.35rem" }}>
            <span className={`badge ${league.gender === "F" ? "badge-f" : "badge-m"}`}>
              {league.gender === "F" ? "♀ Tournoi Femmes" : "♂ Tournoi Hommes"}
            </span>
            <Link href={`/matches?gender=${league.gender}`} className="muted">
              voir les matchs de cette compétition →
            </Link>
          </div>
        </div>
      </div>

      <p className="muted">
        Code d&apos;invitation à partager : <strong style={{ color: "var(--text)" }}>{league.invite_code}</strong>
      </p>

      <h2>Classement</h2>
      <div className="card stack" style={{ gap: "0.15rem" }}>
        {standings?.map((row, i) => {
          const rank = i + 1;
          const isMe = row.user_id === user.id;
          return (
            <div className={`leaderboard-row${isMe ? " me" : ""}`} key={row.user_id}>
              <span className={`rank ${RANK_CLASS[rank] ?? ""}`}>{rank}</span>
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
    </>
  );
}
