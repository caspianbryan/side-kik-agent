"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { signOut } from "@/app/auth-actions";

/** Sidebar + main area for every hub page. The sign-in page renders on its own. */
export function AppShell({
  live,
  hasPassword,
  children,
}: {
  live: boolean;
  hasPassword: boolean;
  children: React.ReactNode;
}) {
  const path = usePathname();
  if (path === "/login") return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row">
      <aside className="border-b border-line bg-surface px-4 py-3 md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:px-3 md:py-6">
        <div className="mb-3 flex items-center justify-between md:mb-6 md:block md:px-3">
          <p className="text-sm font-semibold tracking-tight">WhatsApp Hub</p>
          <p className="flex items-center gap-1.5 text-xs text-ink-3 md:mt-1">
            <span aria-hidden className={`inline-block size-2 rounded-full ${live ? "bg-accent" : "bg-ink-3"}`} />
            {live ? "Live: replies are sent" : "Demo mode: replies are logged"}
          </p>
        </div>
        <Nav />
        {hasPassword && (
          <form action={signOut} className="mt-2 md:mt-auto">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              Sign out
            </button>
          </form>
        )}
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
