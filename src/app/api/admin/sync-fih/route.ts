import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncFihResults } from "@/lib/results/sync";

/**
 * Manual trigger for the same sync the Cron runs every 15 min during the tournament
 * window — lets an admin force a check on demand (e.g. right after a match ends,
 * without waiting) instead of it being a total black box until the next scheduled run.
 */
export async function POST() {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: profile } = await session.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "not_admin" }, { status: 403 });

  const outcome = await syncFihResults(createAdminClient());
  return NextResponse.json(outcome);
}
