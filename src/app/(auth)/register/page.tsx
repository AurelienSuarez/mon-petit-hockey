"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthActionState } from "../actions";

const initialState: AuthActionState = { error: null };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <>
      <h1>Créer un compte</h1>
      <form action={formAction}>
        <label>
          Pseudo
          <input type="text" name="username" required minLength={3} maxLength={24} autoComplete="username" />
        </label>
        <label>
          Email
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <label>
          Mot de passe
          <input type="password" name="password" required minLength={8} autoComplete="new-password" />
        </label>
        {state.error && <p className="error">{state.error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      <p className="muted">
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </>
  );
}
