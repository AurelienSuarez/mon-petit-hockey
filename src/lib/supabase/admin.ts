import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Bypasses Row Level Security entirely. Only import this from server-only code that
 * has independently verified the caller may do the privileged thing it's about to do
 * (e.g. the admin result-entry route checks profiles.is_admin first) — never trust a
 * client-supplied flag before reaching for this client.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}
