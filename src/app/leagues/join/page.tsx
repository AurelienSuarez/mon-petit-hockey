"use client";

import { useActionState } from "react";
import { joinLeagueAction, type LeagueActionState } from "../actions";

const initialState: LeagueActionState = { error: null };

export default function JoinLeaguePage() {
  const [state, formAction, pending] = useActionState(joinLeagueAction, initialState);

  return (
    <div className="card form-card">
      <h1>Rejoindre une ligue</h1>
      <p className="muted">Demande le code à la personne qui a créé la ligue.</p>
      <form action={formAction}>
        <label>
          Code d&apos;invitation
          <input
            type="text"
            name="code"
            required
            minLength={4}
            maxLength={16}
            placeholder="47CF4963"
            style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
          />
        </label>
        {state.error && <p className="error">{state.error}</p>}
        <button type="submit" disabled={pending} style={{ width: "100%" }}>
          {pending ? "..." : "Rejoindre"}
        </button>
      </form>
    </div>
  );
}
