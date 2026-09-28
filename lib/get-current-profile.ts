import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/get-active-business";
import type { Database } from "@/types/database";
import type { SupabaseClient, User as AuthUser } from "@supabase/supabase-js";

// Auth only ever hands us an email at JIT-provision time (no signup form of
// our own to collect a real name from) — falling back to the raw email as
// "name" leaked it as-is into the avatar initial, header and every table.
// Prefer the name from the main site's profile (public.profiles.full_name),
// then one the portal's signup may have captured in user_metadata, else
// turn "jane.doe97@x.com" into "Jane Doe97" instead of showing the address.
function deriveDisplayName(user: AuthUser, mainSiteName?: string | null): string {
  if (mainSiteName?.trim()) return mainSiteName.trim();

  const metaName = (user.user_metadata?.full_name || user.user_metadata?.name) as string | undefined;
  if (metaName?.trim()) return metaName.trim();

  const localPart = user.email?.split("@")[0];
  if (!localPart) return "New user";

  return localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

  // The profile photo/name people actually set live on the main site
  // (public.profiles, portal-owned), not in this tool's own pm.users row —
  // always prefer it over whatever's cached locally so the PM tool's header
  // shows the same avatar as the main site instead of its own placeholder.
  const { data: mainSiteProfile } = await supabase
    .schema("public")
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", ctx.user.id)
    .maybeSingle();

  const { data: existing } = await supabase
    .from("users")
    .select("*, roles(id, name, base_level, permissions)")
    .eq("auth_id", ctx.user.id)
    .eq("business_id", ctx.businessId)
    .maybeSingle();

  if (existing) {
    return {
      ctx,
      profile: mainSiteProfile?.avatar_url ? { ...existing, avatar: mainSiteProfile.avatar_url } : existing,
    };
  }

  // Roles are seeded lazily on first visit rather than by a DB trigger,
  // since businesses created before the roles table existed (and any new
  // one) need their 3 system roles created before anyone can be assigned
  // one — see supabase/migrations/0004_pm_roles_and_permissions.sql.
  await supabase.rpc("ensure_system_roles", { p_business_id: ctx.businessId });

  // The business owner is auto-provisioned as Admin (they own the workspace
  // in the lobby already); everyone else lands in the role_id=null pending
  // state until an existing Admin categorizes them.
  let roleId: string | null = null;
  if (ctx.role === "owner") {
    const { data: adminRole } = await supabase
      .from("roles")
      .select("id")
      .eq("business_id", ctx.businessId)
      .eq("base_level", "admin")
      .single();
    roleId = adminRole?.id ?? null;
  }

  const { data: created, error } = await supabase
    .from("users")
    .insert({
      id: `user-${ctx.user.id}`,
      business_id: ctx.businessId,
      auth_id: ctx.user.id,
      name: deriveDisplayName(ctx.user, mainSiteProfile?.full_name),
      email: ctx.user.email ?? `${ctx.user.id}@unknown`,
      avatar: mainSiteProfile?.avatar_url ?? "",
      role_id: roleId,
    })
    .select("*, roles(id, name, base_level, permissions)")
    .single();

  if (error) throw error;
  return { ctx, profile: created };
}
