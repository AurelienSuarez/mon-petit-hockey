import Link from "next/link";

export function NavBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <nav>
      <div className="nav-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">🏑</span>
          Mon Petit Hockey
        </Link>
        {!isLoggedIn && (
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
