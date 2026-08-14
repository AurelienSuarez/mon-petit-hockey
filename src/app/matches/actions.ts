"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface PredictionActionState {
  error: string | null;
  success?: boolean;
}

const schema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30),
  shootoutWinner: z.enum(["home", "away"]).optional(),
});

export async function submitPredictionAction(
  _prev: PredictionActionState,
  formData: FormData,
): Promise<PredictionActionState> {
  const parsed = schema.safeParse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
    shootoutWinner: formData.get("shootoutWinner") || undefined,
  });

  if (!parsed.success) return { error: "Score invalide" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté" };

  // submit_prediction() also snapshots the teams' current Elo onto the row (used to
  // price the prediction's odds at scoring time) — something a plain client upsert
  // can't do without exposing those columns to direct client writes.
  const { error } = await supabase.rpc("submit_prediction", {
    p_match_id: parsed.data.matchId,
    p_home_score: parsed.data.homeScore,
    p_away_score: parsed.data.awayScore,
    p_shootout_winner: parsed.data.shootoutWinner ?? null,
  });

  if (error) {
    const locked = error.message.includes("predictions_locked");
    return { error: locked ? "Ce match a déjà commencé, le pronostic est verrouillé." : error.message };
  }

  revalidatePath(`/matches/${parsed.data.matchId}`);
  revalidatePath("/matches");
  return { error: null, success: true };
}
