import Link from "next/link";

/**
 * Basic app shell: sidebar + header.
 * Devs: add your nav items to the `nav` array and build pages inside this shell.
 */
const nav = [{ href: "/", label: "Dashboard" }];

export function AppShell({
  businessName,
  children,
}: {
  businessName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 p-4 font-semibold">
          Project Management
        </div>
        <nav className="space-y-1 p-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded px-3 py-2 text-sm hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-6">
          <span className="text-sm font-medium">{businessName}</span>
          <span className="text-xs text-neutral-500">signed in</span>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
