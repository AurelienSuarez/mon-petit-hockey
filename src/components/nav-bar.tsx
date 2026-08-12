import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";

export function NavBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav>
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">🏑</span>
          Prono CM 2026
        </Link>
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="nav-link">
              Mes ligues
            </Link>
            <Link href="/matches" className="nav-link">
              Matchs
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="btn-secondary btn-sm">
                Déconnexion
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-link">
              Connexion
            </Link>
            <Link href="/register" className="btn btn-sm">
              Créer un compte
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
