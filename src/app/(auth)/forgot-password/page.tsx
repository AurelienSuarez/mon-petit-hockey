"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type AuthActionState } from "../actions";
import { HockeyIllustration } from "@/components/hockey-illustration";

const initialState: AuthActionState = { error: null };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <div className="card form-card">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
        <HockeyIllustration />
      </div>
      <h1 style={{ textAlign: "center" }}>Mot de passe oublié</h1>
      <p className="muted" style={{ textAlign: "center", marginBottom: "1.25rem" }}>
        On t&apos;envoie un lien pour en choisir un nouveau.
      </p>

      {state.success ? (
        <p className="success-note" style={{ textAlign: "center" }}>
          Si un compte existe avec cet email, un lien de réinitialisation vient d&apos;être envoyé. Vérifie ta boîte
          mail (et les spams).
        </p>
      ) : (
        <form action={formAction}>
          <label>
            Email
            <input type="email" name="email" required autoComplete="email" />
          </label>
          {state.error && <p className="error">{state.error}</p>}
          <button type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      )}

      <p className="muted" style={{ textAlign: "center", marginTop: "1rem" }}>
        <Link href="/login">← Retour à la connexion</Link>
      </p>
    </div>
  );
}
