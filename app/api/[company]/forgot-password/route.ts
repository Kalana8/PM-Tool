import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Unauthenticated self-service password reset from app/[company]/user-login.
 * Verification is email-match only — there's no email-link infrastructure
 * to prove inbox ownership, and this is a deliberate, explicitly-accepted
 * tradeoff for an internal tool (same call already made for admin-viewable
 * stored passwords): anyone who knows a registered employee's email for
 * this business can set a new password for that account. No further
 * confirmation step.
 */
export async function POST(request: Request, { params }: { params: Promise<{ company: string }> }) {
  const { company } = await params;
  const body = await request.json().catch(() => null);
  const email = body?.email as string | undefined;
  const newPassword = body?.newPassword as string | undefined;

  if (!email || !newPassword || newPassword.length < 6) {
    return NextResponse.json({ error: "Enter your email and a password of at least 6 characters." }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Password reset isn't configured yet (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 }
    );
  }
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

  const { data: business } = await admin
    .schema("public")
    .from("businesses")
    .select("id")
    .eq("slug", company)
    .maybeSingle();
  if (!business) {
    return NextResponse.json({ error: "This company page doesn't exist." }, { status: 404 });
  }

  const { data: target } = await admin
    .schema("pm")
    .from("users")
    .select("id, auth_id")
    .eq("business_id", business.id)
    .eq("email", email)
    .maybeSingle();
  if (!target || !target.auth_id) {
    return NextResponse.json({ error: "No account found with that email for this business." }, { status: 404 });
  }

  const { error: updateErr } = await admin.auth.admin.updateUserById(target.auth_id, { password: newPassword });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  // They now know their new password — no forced change needed, and any
  // stale admin-viewable temp password no longer matches, so drop it.
  await admin.schema("pm").from("users").update({ must_change_password: false }).eq("id", target.id);
  await admin.schema("pm").from("user_credentials").delete().eq("user_id", target.id);

  return NextResponse.json({ ok: true });
}
