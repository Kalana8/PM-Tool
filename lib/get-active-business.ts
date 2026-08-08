import { createClient } from "@/lib/supabase/server";

/**
 * Returns the logged-in user + their active business + role.
 * First membership = active business. Extend with a switcher later if needed.
 */
export async function getActiveBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .schema("public")
    .from("business_members")
    .select("business_id, role, businesses(id, name, logo_url)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!data) return { user, businessId: null, role: null, business: null };

  return {
    user,
    businessId: data.business_id,
    role: data.role,
    business: data.businesses,
  };
}
