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
        <label>
          Compétition
          <select name="gender" required defaultValue="">
            <option value="" disabled>
              Choisir...
            </option>
            <option value="M">Tournoi Hommes</option>
            <option value="F">Tournoi Femmes</option>
          </select>
        </label>
        <p className="muted">
          Une ligue ne concerne qu&apos;une seule compétition — le classement ne comptera que les points sur ces
          matchs-là. Crée une deuxième ligue si tu veux aussi suivre l&apos;autre tournoi.
        </p>
        {state.error && <p className="error">{state.error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? "Création..." : "Créer"}
        </button>
      </form>
    </>
  );
}
