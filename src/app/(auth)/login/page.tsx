"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthActionState } from "../actions";
import { HockeyIllustration } from "@/components/hockey-illustration";

const initialState: AuthActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="card form-card">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
        <HockeyIllustration />
      </div>
      <h1 style={{ textAlign: "center" }}>Connexion</h1>
      <p className="muted" style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        Retrouve tes ligues et tes pronostics.
      </p>
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
        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
      <p className="muted" style={{ textAlign: "center", marginTop: "1rem" }}>
        <Link href="/forgot-password">Mot de passe oublié ?</Link>
      </p>
      <p className="muted" style={{ textAlign: "center", marginTop: "0.4rem" }}>
        Pas encore de compte ? <Link href="/register">Créer un compte</Link>
      </p>
    </div>
  );
}
