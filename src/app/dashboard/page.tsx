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
      <h1>Mes ligues</h1>
      <p>
        <Link href="/leagues/new">+ Créer une ligue</Link> · <Link href="/leagues/join">Rejoindre avec un code</Link>
      </p>

      {!leagues?.length && <p className="muted">Tu n&apos;es dans aucune ligue pour l&apos;instant.</p>}

      {leagues?.map((league) => (
        <div className="card" key={league.id}>
          <Link href={`/leagues/${league.id}`}>
            <strong>{league.name}</strong> · {league.gender === "F" ? "♀ Femmes" : "♂ Hommes"}
          </Link>
          <p className="muted">Code d&apos;invitation : {league.invite_code}</p>
        </div>
      ))}
    </>
  );
}
