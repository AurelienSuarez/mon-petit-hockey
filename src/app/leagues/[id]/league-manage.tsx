"use client";

import { useActionState, useState } from "react";
import { deleteLeagueAction, type LeagueActionState } from "../actions";

const initialState: LeagueActionState = { error: null };

export function LeagueManage({ leagueId, inviteCode }: { leagueId: string; inviteCode: string }) {
  const [state, formAction, pending] = useActionState(deleteLeagueAction, initialState);
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function shareInvite() {
    const url = `${window.location.origin}/leagues/join?code=${inviteCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Rejoins ma ligue sur Mon Petit Hockey", url });
        return;
      } catch {
        // User cancelled the share sheet, or the browser rejected it — fall through
        // to clipboard so the button still does something useful.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card stack" style={{ gap: "0.6rem" }}>
      <strong>Gérer la ligue</strong>

      <div className="row">
        <button type="button" className="btn-secondary btn-sm" onClick={shareInvite}>
          {copied ? "✓ Lien copié" : "Partager l'invitation"}
        </button>

        {!confirmingDelete ? (
          <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmingDelete(true)}>
            Supprimer la ligue
          </button>
        ) : (
          <form action={formAction} className="row" style={{ gap: "0.5rem" }}>
            <input type="hidden" name="leagueId" value={leagueId} />
            <span className="muted">Supprimer pour tout le monde, sans retour en arrière possible ?</span>
            <button type="submit" disabled={pending} style={{ background: "var(--danger)" }}>
              {pending ? "..." : "Confirmer"}
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmingDelete(false)}>
              Annuler
            </button>
          </form>
        )}
      </div>

      {state.error && <p className="error">{state.error}</p>}
    </div>
  );
}
