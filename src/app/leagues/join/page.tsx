"use client";

import { useActionState } from "react";
import { joinLeagueAction, type LeagueActionState } from "../actions";

const initialState: LeagueActionState = { error: null };

export default function JoinLeaguePage() {
  const [state, formAction, pending] = useActionState(joinLeagueAction, initialState);

  return (
    <>
      <h1>Rejoindre une ligue</h1>
      <form action={formAction}>
        <label>
          Code d&apos;invitation
          <input type="text" name="code" required minLength={4} maxLength={16} style={{ textTransform: "uppercase" }} />
        </label>
        {state.error && <p className="error">{state.error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? "..." : "Rejoindre"}
        </button>
      </form>
    </>
  );
}
