import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, invite_code, owner_id")
    .eq("id", id)
    .single();

  if (!league) notFound();

  const { data: standings } = await supabase.rpc("league_standings", { p_league_id: id });

  return (
    <>
      <h1>{league.name}</h1>
      <p className="muted">
        Code d&apos;invitation à partager : <strong>{league.invite_code}</strong>
      </p>

      <h2>Classement</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Joueur</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {standings?.map((row, i) => (
            <tr key={row.user_id}>
              <td>{i + 1}</td>
              <td>
                {row.username}
                {row.user_id === user.id ? " (toi)" : ""}
              </td>
              <td>{row.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
