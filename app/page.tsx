import { getCurrentProfile } from "@/lib/get-current-profile";
import { AppShell } from "@/components/app-shell";
import { BizYepApp } from "@/components/bizyep-app";
import { ChangePasswordGate } from "@/components/ChangePasswordGate";
import { mapUser } from "@/lib/supabase/mappers";

export default async function Home() {
  const { ctx, profile } = await getCurrentProfile();

  // BizYep renders its own full-page chrome (Sidebar + Header), so once a
  // role is assigned it's rendered standalone rather than nested inside
  // AppShell's own sidebar/header — avoids a double shell. AppShell is only
  // used for the simpler pending/no-business states below.
  if (profile?.role_id) {
    // Every admin-created/reset password is temporary — block the app until
    // the employee sets their own (supabase/migrations/0007_pm_password_reset_flow.sql).
    if (profile.must_change_password) {
      return <ChangePasswordGate userId={profile.id} name={profile.name} />;
    }

    return (
      <BizYepApp
        initialProfile={mapUser(profile)}
        businessId={ctx!.businessId!}
        businessSlug={ctx!.business?.slug ?? null}
        businessName={ctx!.business?.name ?? null}
      />
    );
  }

  return (
    <AppShell businessName={ctx?.business?.name ?? "No business"}>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Project Management</h1>
        {!profile ? (
          <p className="mt-2 text-neutral-600">No active business found for this account.</p>
        ) : (
          <p className="mt-2 text-neutral-600">
            Pending admin approval — signed in as {profile.email}, no role assigned yet.
          </p>
        )}
      </div>
    </AppShell>
  );
}
