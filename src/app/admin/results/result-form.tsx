"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function ResultForm({ matchId, isKnockout }: { matchId: string; isKnockout: boolean }) {
  const router = useRouter();
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeSo, setHomeSo] = useState<number | "">("");
  const [awaySo, setAwaySo] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isTie = homeScore === awayScore;

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          homeScore,
          awayScore,
          homeSoScore: isKnockout && isTie && homeSo !== "" ? Number(homeSo) : undefined,
          awaySoScore: isKnockout && isTie && awaySo !== "" ? Number(awaySo) : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Erreur (${res.status})`);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      <input
        type="number"
        min={0}
        max={50}
        value={homeScore}
        onChange={(e) => setHomeScore(Number(e.target.value))}
        style={{ width: 60 }}
      />
      <span>–</span>
      <input
        type="number"
        min={0}
        max={50}
        value={awayScore}
        onChange={(e) => setAwayScore(Number(e.target.value))}
        style={{ width: 60 }}
      />
      {isKnockout && isTie && (
        <>
          <span className="muted">tab :</span>
          <input
            type="number"
            min={0}
            max={20}
            value={homeSo}
            onChange={(e) => setHomeSo(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: 50 }}
          />
          <span>–</span>
          <input
            type="number"
            min={0}
            max={20}
            value={awaySo}
            onChange={(e) => setAwaySo(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: 50 }}
          />
        </>
      )}
      <button type="button" onClick={submit} disabled={pending} className="btn-sm">
        {pending ? "..." : "Valider"}
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  );
}
