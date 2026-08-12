"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .trim()
    .min(3, "3 caractères minimum")
    .max(24, "24 caractères maximum")
    .regex(/^[a-zA-Z0-9_-]+$/, "Lettres, chiffres, - et _ uniquement"),
  password: z.string().min(8, "8 caractères minimum"),
});

export interface AuthActionState {
  error: string | null;
}

export async function registerAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { username: parsed.data.username } },
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Mot de passe requis"),
});

export async function loginAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: "Email ou mot de passe incorrect" };

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
