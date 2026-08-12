"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface LeagueActionState {
  error: string | null;
}

const createSchema = z.object({
  name: z.string().trim().min(3, "3 caractères minimum").max(60, "60 caractères maximum"),
});

export async function createLeagueAction(
  _prev: LeagueActionState,
  formData: FormData,
): Promise<LeagueActionState> {
  const parsed = createSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Nom invalide" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_league", { p_name: parsed.data.name });
  if (error || !data) return { error: error?.message ?? "Erreur lors de la création" };

  redirect(`/leagues/${data.id}`);
}

const joinSchema = z.object({
  code: z.string().trim().min(4, "Code invalide").max(16, "Code invalide"),
});

export async function joinLeagueAction(_prev: LeagueActionState, formData: FormData): Promise<LeagueActionState> {
  const parsed = joinSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) return { error: "Code invalide" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_league_by_code", { p_code: parsed.data.code });
  if (error || !data) return { error: "Code d'invitation invalide" };

  redirect(`/leagues/${data.id}`);
}
