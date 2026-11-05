"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { phone, timeAgo } from "@/lib/format";

type Row = {
  id: number;
  name: string | null;
  waId: string;
  isDemo: boolean;
  lastBody: string | null;
  lastDirection: "in" | "out" | null;
  lastAt: string | null;
};

export function ContactList({ contacts }: { contacts: Row[] }) {
  const path = usePathname();
  const onThread = path !== "/inbox";

  return (
    <section className={`${onThread ? "hidden md:block" : ""}`} aria-label="Chats">
      <h1 className="mb-3 text-xl font-semibold tracking-tight">Inbox</h1>
      {contacts.length === 0 ? (
        <p className="text-sm text-ink-2">No chats yet. Messages to your number land here.</p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-line bg-surface">
          {contacts.map((c) => {
            const active = path === `/inbox/${c.id}`;
            return (
              <li key={c.id} className="border-b border-line last:border-b-0">
                <Link
                  href={`/inbox/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`block px-4 py-3 ${active ? "bg-accent-soft" : "hover:bg-surface-2"}`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium">{c.name || phone(c.waId)}</span>
                    <span className="shrink-0 text-xs text-ink-3">{timeAgo(c.lastAt)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink-2">
                    {c.lastDirection === "out" && <span className="text-ink-3">You: </span>}
                    {c.lastBody?.split("\n")[0]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
