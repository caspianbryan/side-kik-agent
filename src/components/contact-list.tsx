"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { initials, phone, timeAgo } from "@/lib/format";

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
    <section className={cn("min-w-0", onThread && "hidden md:block")} aria-label="Chats">
      <h1 className="font-display mb-6 text-h1 leading-[1.15]">Inbox</h1>
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chats yet. Messages to your number land here.</p>
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card">
          {contacts.map((c) => {
            const active = path === `/inbox/${c.id}`;
            return (
              <li key={c.id} className="border-b last:border-b-0">
                <Link
                  href={`/inbox/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex gap-3 px-4 py-3.5 transition-colors duration-150",
                    active ? "bg-accent before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-primary" : "hover:bg-accent/60",
                  )}
                >
                  <Avatar className="size-9">
                    <AvatarFallback>{initials(c.name, "#")}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.name || phone(c.waId)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.lastAt)}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-sm text-muted-foreground">
                        {c.lastDirection === "out" && "You: "}
                        {c.lastBody?.split("\n")[0]}
                      </span>
                      {c.isDemo && <Badge variant="warning" className="ml-auto">Demo</Badge>}
                    </span>
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
