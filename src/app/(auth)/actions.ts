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
  success?: boolean;
}

// Supabase only honors a resetPasswordForEmail redirectTo that's on the project's
// Redirect URLs allow list — kept as one constant since it has to match exactly what's
// configured there (see supabase/migrations for the rest of the app's config surface;
// this one lives in Supabase's dashboard, not a migration, since it's an Auth setting).
const SITE_URL = "https://mon-petit-hockey.cestfun.workers.dev";

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

const forgotPasswordSchema = z.object({ email: z.string().email() });

export async function forgotPasswordAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: "Email invalide" };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/reset-password`,
  });

  // Same success response whether or not the email is actually registered — never
  // reveals which addresses have accounts.
  return { error: null, success: true };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
