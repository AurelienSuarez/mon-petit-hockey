"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "../actions";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <>
      <h1>Connexion</h1>
      <form action={formAction}>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Mot de passe
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        {state.error && <p className="error">{state.error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p className="muted">
        Pas encore de compte ? <Link href="/register">Créer un compte</Link>
      </p>
    </>
  );
}
