import type { ReactNode } from "react";

/** Page title in the display serif, with an optional one-line lead and action. */
export function PageHeader({ title, lead, action }: { title: string; lead?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-h1 leading-[1.15] font-normal">{title}</h1>
        {lead && <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{lead}</p>}
      </div>
      {action}
    </header>
  );
}
