import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/get-active-business";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a real Supabase Auth login for a new employee, then (using the
 * calling Admin's own RLS-respecting session, not the service-role client)
 * links it into this business: a public.business_members row, the pm.users
 * profile row, and a pm.user_credentials row so the password can be viewed
 * again later from the Users page.
 *
 * The service-role key is only ever used for the single auth.admin.createUser
 * call below — every other write rides on the caller's own permissions via
 * RLS, and any failure after the auth account is created rolls it back.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { name, email, password, departmentId, title, phone, roleId, teamLeaderId } = body ?? {};

  if (!name || !email || !password || !departmentId || !title || !roleId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const ctx = await getActiveBusiness();
  if (!ctx?.businessId) {
    return NextResponse.json({ error: "No active business for this session." }, { status: 401 });
  }

  const supabase = (await createClient()) as unknown as SupabaseClient<Database, "pm">;

  const [{ data: canManageLogin }, { data: canAddUsers }] = await Promise.all([
    supabase.rpc("current_app_has_action", { p_action: "users.manage_login" }),
    supabase.rpc("current_app_has_action", { p_action: "users.add" }),
  ]);
  if (!canManageLogin || !canAddUsers) {
    return NextResponse.json({ error: "Not authorized to create employee logins." }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Employee login creation isn't configured yet (missing SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 500 }
    );
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? "Failed to create login." }, { status: 400 });
  }

  const authId = created.user.id;
  const userId = `user-${authId}`;

  const { error } = await linkNewEmployee(supabase, {
    userId,
    authId,
    businessId: ctx.businessId,
    name,
    email,
    password,
    roleId,
    departmentId,
    title,
    phone,
    teamLeaderId,
  });
  if (error) {
    await admin.auth.admin.deleteUser(authId);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ id: userId, authId });
}

async function linkNewEmployee(
  supabase: SupabaseClient<Database, "pm">,
  fields: {
    userId: string;
    authId: string;
    businessId: string;
    name: string;
    email: string;
    password: string;
    roleId: string;
    departmentId: string;
    title: string;
    phone?: string;
    teamLeaderId?: string;
  }
): Promise<{ error: { message: string } | null }> {
  const memberRes = await supabase
    .schema("public")
    .from("business_members")
    .insert({ business_id: fields.businessId, user_id: fields.authId, role: "employee" });
  if (memberRes.error) return { error: memberRes.error };

  const profileRes = await supabase.from("users").insert({
    id: fields.userId,
    business_id: fields.businessId,
    auth_id: fields.authId,
    name: fields.name,
    email: fields.email,
    role_id: fields.roleId,
    department_id: fields.departmentId,
    status: "Active",
    title: fields.title,
    phone: fields.phone || null,
    team_leader_id: fields.teamLeaderId || null,
    must_change_password: true,
  });
  if (profileRes.error) return { error: profileRes.error };

  const credRes = await supabase
    .from("user_credentials")
    .insert({ user_id: fields.userId, business_id: fields.businessId, password: fields.password });
  if (credRes.error) return { error: credRes.error };

  return { error: null };
}
