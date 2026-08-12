"use client";

import { useActionState } from "react";
import { createLeagueAction, type LeagueActionState } from "../actions";

const initialState: LeagueActionState = { error: null };

export default function NewLeaguePage() {
  const [state, formAction, pending] = useActionState(createLeagueAction, initialState);

  return (
    <>
      <h1>Créer une ligue</h1>
      <form action={formAction}>
        <label>
          Nom de la ligue
          <input type="text" name="name" required minLength={3} maxLength={60} />
        </label>
        {state.error && <p className="error">{state.error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer"}
        </button>
      </form>
    </>
  );
}
