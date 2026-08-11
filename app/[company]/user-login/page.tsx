import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

/**
 * Per-company login page (pm.bizyep.com.au/{company-slug}/user-login).
 * Anonymous visitors can't read public.businesses via RLS ("members read
 * business" requires is_business_member or owner_id = auth.uid()), so the
 * slug -> business lookup below uses a one-off service-role client rather
 * than adding a new public-read policy just for a name lookup.
 */
export default async function CompanyLoginPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { company } = await params;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Login isn&apos;t configured yet (missing SUPABASE_SERVICE_ROLE_KEY).
      </div>
    );
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
  const { data: business } = await admin
    .schema("public")
    .from("businesses")
    .select("id, name, slug")
    .eq("slug", company)
    .maybeSingle();

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        This company page doesn&apos;t exist.
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/");
  }

  return <LoginForm business={business} />;
}
