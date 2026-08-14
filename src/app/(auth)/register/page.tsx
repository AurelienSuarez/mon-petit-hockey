"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthActionState } from "../actions";
import { HockeyIllustration } from "@/components/hockey-illustration";

const initialState: AuthActionState = { error: null };

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <div className="card form-card">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
        <HockeyIllustration />
      </div>
      <h1 style={{ textAlign: "center" }}>Créer un compte</h1>
      <p className="muted" style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        Rejoins la Coupe du monde de hockey 2026.
      </p>
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
        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {pending ? "Création..." : "Créer mon compte"}
        </button>
      </form>
      <p className="muted" style={{ textAlign: "center", marginTop: "1rem" }}>
        Déjà un compte ? <Link href="/login">Se connecter</Link>
      </p>
    </div>
  );
}
