import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/get-active-business";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Admin-driven password reset for an existing employee — sets a new
 * temporary password via the Auth Admin API (service role, same minimal-
 * privilege pattern as app/api/admin/create-employee), then marks the
 * account as needing a forced password change on next login and stores the
 * new temp password (via the caller's own RLS-respecting session, not the
 * service-role client) so it's viewable from the Users page until the
 * employee changes it themselves.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { userId, newPassword } = body ?? {};
  if (!userId || !newPassword || String(newPassword).length < 6) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const ctx = await getActiveBusiness();
  if (!ctx?.businessId) {
    return NextResponse.json({ error: "No active business for this session." }, { status: 401 });
  }

  const supabase = (await createClient()) as unknown as SupabaseClient<Database, "pm">;

  const { data: canManageLogin } = await supabase.rpc("current_app_has_action", { p_action: "users.manage_login" });
  if (!canManageLogin) {
    return NextResponse.json({ error: "Not authorized to reset employee passwords." }, { status: 403 });
  }

  const { data: target, error: targetErr } = await supabase
    .from("users")
    .select("id, auth_id, business_id")
    .eq("id", userId)
    .maybeSingle();
  if (targetErr || !target || !target.auth_id || target.business_id !== ctx.businessId) {
    return NextResponse.json({ error: "Employee not found." }, { status: 404 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Password reset isn't configured yet (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 }
    );
  }
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

  const { error: updateErr } = await admin.auth.admin.updateUserById(target.auth_id, { password: newPassword });
  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  const { error: credErr } = await supabase
    .from("user_credentials")
    .upsert({ user_id: userId, business_id: ctx.businessId, password: newPassword }, { onConflict: "user_id" });
  if (credErr) {
    return NextResponse.json({ error: credErr.message }, { status: 400 });
  }

  const { error: flagErr } = await supabase.from("users").update({ must_change_password: true }).eq("id", userId);
  if (flagErr) {
    return NextResponse.json({ error: flagErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
