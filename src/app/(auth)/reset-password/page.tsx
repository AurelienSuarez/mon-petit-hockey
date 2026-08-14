"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { HockeyIllustration } from "@/components/hockey-illustration";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  // The recovery session is established client-side from the URL the email link sent
  // the user to (Supabase's browser client parses it on init) — there's nothing to
  // show until that's happened, and no reliable session means the link was invalid or
  // has expired.
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus((s) => (s === "checking" ? "ready" : s));
    });

    const timeout = setTimeout(() => setStatus((s) => (s === "checking" ? "invalid" : s)), 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("8 caractères minimum");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas");

    setPending(true);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="card form-card">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
        <HockeyIllustration />
      </div>
      <h1 style={{ textAlign: "center" }}>Nouveau mot de passe</h1>

      {status === "checking" && (
        <p className="muted" style={{ textAlign: "center" }}>
          Vérification du lien...
        </p>
      )}

      {status === "invalid" && (
        <>
          <p className="error" style={{ textAlign: "center" }}>
            Ce lien n&apos;est plus valide ou a déjà été utilisé.
          </p>
          <p className="muted" style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/forgot-password">Demander un nouveau lien →</Link>
          </p>
        </>
      )}

      {status === "ready" && (
        <form onSubmit={handleSubmit}>
          <label>
            Nouveau mot de passe
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Confirmer le mot de passe
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "..." : "Valider le nouveau mot de passe"}
          </button>
        </form>
      )}
    </div>
  );
}
