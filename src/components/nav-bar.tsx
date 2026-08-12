import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

export function NavBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav>
      <strong>
        <Link href="/">🏑 Prono CM 2026</Link>
      </strong>
      {isLoggedIn ? (
        <>
          <Link href="/dashboard">Mes ligues</Link>
          <Link href="/matches">Matchs</Link>
          <form action={logoutAction}>
            <button type="submit">Déconnexion</button>
          </form>
        </>
      ) : (
        <>
          <Link href="/login">Connexion</Link>
          <Link href="/register">Créer un compte</Link>
        </>
      )}
    </nav>
  );
}
