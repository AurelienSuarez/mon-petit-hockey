"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { joinLeagueAction, type LeagueActionState } from "../actions";

const initialState: LeagueActionState = { error: null };

function JoinLeagueForm() {
  const [state, formAction, pending] = useActionState(joinLeagueAction, initialState);
  const codeFromLink = useSearchParams().get("code") ?? "";

  return (
    <form action={formAction}>
      <label>
        Code d&apos;invitation
        <input
          type="text"
          name="code"
          required
          minLength={4}
          maxLength={16}
          defaultValue={codeFromLink}
          placeholder="47CF4963"
          style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
        />
      </label>
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={pending} style={{ width: "100%" }}>
        {pending ? "..." : "Rejoindre"}
      </button>
    </form>
  );
}

export default function JoinLeaguePage() {
  return (
    <div className="card form-card">
      <h1>Rejoindre une ligue</h1>
      <p className="muted">Demande le code à la personne qui a créé la ligue.</p>
      <Suspense>
        <JoinLeagueForm />
      </Suspense>
    </div>
  );
}
