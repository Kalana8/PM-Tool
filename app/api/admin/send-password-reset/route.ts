import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/get-active-business";
import { getSupabaseAdmin } from "@/lib/supabase/adminClient";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Emails a Supabase password reset link to an employee of the caller's
 * business. Sent with the service role client because Supabase's CAPTCHA
 * check skips admin requests; the permission and same-business checks below
 * stand in for the bot check.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email) return NextResponse.json({ error: "Missing email." }, { status: 400 });

  const ctx = await getActiveBusiness();
  if (!ctx?.businessId) {
    return NextResponse.json({ error: "No active business for this session." }, { status: 401 });
  }

  const supabase = (await createClient()) as unknown as SupabaseClient<Database, "pm">;
  const { data: canManageLogin } = await supabase.rpc("current_app_has_action", { p_action: "users.manage_login" });
  if (!canManageLogin) {
    return NextResponse.json({ error: "Not authorized to reset employee passwords." }, { status: 403 });
  }

  const { data: target } = await supabase
    .from("users")
    .select("id")
    .eq("business_id", ctx.businessId)
    .eq("email", email)
    .maybeSingle();
  if (!target) return NextResponse.json({ error: "Employee not found." }, { status: 404 });

  const { error } = await getSupabaseAdmin().auth.resetPasswordForEmail(email, {
    redirectTo: new URL(request.url).origin,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
