import { getActiveBusiness } from "@/lib/get-active-business";
import { AppShell } from "@/components/app-shell";

export default async function Home() {
  const ctx = await getActiveBusiness();

  return (
    <AppShell businessName={ctx?.business?.name ?? "No business"}>
      <div className="p-8">
        <h1 className="text-2xl font-bold">Project Management</h1>
        <p className="mt-2 text-neutral-600">
          Auth works. Start building your features here. Read
          BEGINNER_DEV_GUIDE.md first.
        </p>
      </div>
    </AppShell>
  );
}
