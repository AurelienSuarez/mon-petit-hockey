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

  const isTie = parsed.data.homeScore === parsed.data.awayScore;

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: parsed.data.matchId,
      pred_home_score: parsed.data.homeScore,
      pred_away_score: parsed.data.awayScore,
      pred_shootout_winner: isTie ? (parsed.data.shootoutWinner ?? null) : null,
    },
    { onConflict: "user_id,match_id" },
  );

  if (error) {
    const locked = error.message.includes("predictions_locked");
    return { error: locked ? "Ce match a déjà commencé, le pronostic est verrouillé." : error.message };
  }

  revalidatePath(`/matches/${parsed.data.matchId}`);
  return { error: null, success: true };
}
