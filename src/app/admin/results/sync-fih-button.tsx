"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface SyncOutcome {
  applied: string[];
  skipped: { gameId: string; reason: string }[];
}

export function SyncFihButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [outcome, setOutcome] = useState<SyncOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    setOutcome(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/sync-fih", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Erreur (${res.status})`);
        return;
      }
      const data = (await res.json()) as SyncOutcome;
      setOutcome(data);
      router.refresh();
    });
  };

  return (
    <div className="card stack" style={{ gap: "0.5rem", marginBottom: "1.5rem" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <strong>Synchro FIH</strong>
          <p className="muted" style={{ margin: "0.15rem 0 0" }}>
            Tourne toute seule toutes les 15 min pendant le tournoi — ce bouton force une vérification immédiate.
          </p>
        </div>
        <button type="button" onClick={run} disabled={pending} className="btn-secondary btn-sm">
          {pending ? "Vérification..." : "Vérifier maintenant"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {outcome && (
        <div className="muted" style={{ fontSize: "0.85rem" }}>
          {outcome.applied.length === 0 && outcome.skipped.length === 0 && "Rien de nouveau côté FIH."}
          {outcome.applied.length > 0 && <p style={{ margin: "0.2rem 0" }}>✓ {outcome.applied.length} résultat(s) appliqué(s).</p>}
          {outcome.skipped.length > 0 && (
            <p style={{ margin: "0.2rem 0" }}>
              {outcome.skipped.length} match(s) ignoré(s) : {outcome.skipped.map((s) => `${s.gameId} (${s.reason})`).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
