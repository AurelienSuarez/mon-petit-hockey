"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface LeagueActionState {
  error: string | null;
}

const createSchema = z.object({
  name: z.string().trim().min(3, "3 caractères minimum").max(60, "60 caractères maximum"),
  gender: z.enum(["M", "F"], { message: "Choisis une compétition" }),
});

export async function createLeagueAction(
  _prev: LeagueActionState,
  formData: FormData,
): Promise<LeagueActionState> {
  const parsed = createSchema.safeParse({ name: formData.get("name"), gender: formData.get("gender") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_league", {
    p_name: parsed.data.name,
    p_gender: parsed.data.gender,
  });
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

export async function deleteLeagueAction(_prev: LeagueActionState, formData: FormData): Promise<LeagueActionState> {
  const leagueId = z.string().uuid().safeParse(formData.get("leagueId"));
  if (!leagueId.success) return { error: "Ligue invalide" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_league", { p_league_id: leagueId.data });
  if (error) return { error: "Seul le créateur de la ligue peut la supprimer." };

  redirect("/dashboard");
}
