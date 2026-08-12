import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { supabase } = await requireUser();

  const { data: leagues } = await supabase
    .from("leagues")
    .select("id, name, invite_code, gender")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="page-header">
        <h1>Mes ligues</h1>
        <div className="row">
          <Link href="/leagues/join" className="btn btn-secondary btn-sm">
            Rejoindre avec un code
          </Link>
          <Link href="/leagues/new" className="btn btn-sm">
            + Créer une ligue
          </Link>
        </div>
      </div>

      {!leagues?.length && (
        <div className="empty-state">
          <span className="emoji">🏑</span>
          Tu n&apos;es dans aucune ligue pour l&apos;instant.
          <br />
          Crée-en une, ou rejoins celle d&apos;un ami avec son code d&apos;invitation.
        </div>
      )}

      <div className="stack">
        {leagues?.map((league) => (
          <Link className="card" href={`/leagues/${league.id}`} key={league.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{league.name}</strong>
              <span className={`badge ${league.gender === "F" ? "badge-f" : "badge-m"}`}>
                {league.gender === "F" ? "♀ Femmes" : "♂ Hommes"}
              </span>
            </div>
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              Code d&apos;invitation : {league.invite_code}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
