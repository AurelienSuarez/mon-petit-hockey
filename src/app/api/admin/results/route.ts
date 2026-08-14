import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeMatchResult } from "@/lib/results/finalize-match";

const bodySchema = z
  .object({
    matchId: z.string().uuid(),
    homeScore: z.number().int().min(0).max(50),
    awayScore: z.number().int().min(0).max(50),
    homeSoScore: z.number().int().min(0).max(50).nullable().optional(),
    awaySoScore: z.number().int().min(0).max(50).nullable().optional(),
  })
  .refine((b) => (b.homeSoScore == null) === (b.awaySoScore == null), {
    message: "homeSoScore and awaySoScore must be provided together",
  });

const ERROR_STATUS: Record<string, number> = {
  match_not_found: 404,
  already_finished: 409,
  teams_not_resolved: 409,
  shootout_scores_required: 400,
};

export async function POST(request: Request) {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

  const { data: profile } = await session.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "not_admin" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", details: parsed.error.issues }, { status: 400 });
  }

  const result = await finalizeMatchResult(createAdminClient(), parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error] ?? 500 });
  }

  return NextResponse.json({ ok: true, slotsResolved: result.slotsResolved, oddsRefreshed: result.oddsRefreshed });
}
