import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/get-active-business";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves the signed-in user's pm.users profile for their active business,
 * JIT-provisioning a role=null "pending admin categorization" row on first
 * login (see supabase/migrations/0003_pm_users_self_provision.sql) since
 * there's no auth.users trigger available to us (lead-owned schema).
 *
 * createClient() is only typed <Database> (defaults to the "public" schema
 * generic) even though it's wired at runtime to NEXT_PUBLIC_TOOL_SCHEMA=pm
 * (see lib/supabase/server.ts, which we can't edit) — recast here so
 * .from("users") resolves against pm's tables instead of "never".
 */
export async function getCurrentProfile() {
  const ctx = await getActiveBusiness();
  if (!ctx?.businessId) return { ctx, profile: null };

  const supabase = (await createClient()) as unknown as SupabaseClient<Database, "pm">;
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", ctx.user.id)
    .eq("business_id", ctx.businessId)
    .maybeSingle();

  if (existing) return { ctx, profile: existing };

  // The business owner is auto-provisioned as Admin (they own the workspace
  // in the lobby already); everyone else lands in the role=null pending
  // state until an existing Admin categorizes them.
  const { data: created, error } = await supabase
    .from("users")
    .insert({
      id: `user-${ctx.user.id}`,
      business_id: ctx.businessId,
      auth_id: ctx.user.id,
      name: ctx.user.email ?? "New user",
      email: ctx.user.email ?? `${ctx.user.id}@unknown`,
      role: ctx.role === "owner" ? "Admin" : null,
    })
    .select()
    .single();

  if (error) throw error;
  return { ctx, profile: created };
}
