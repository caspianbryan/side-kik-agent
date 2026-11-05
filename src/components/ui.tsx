import type { ReactNode } from "react";

export function PageHeader({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {lead && <p className="mt-1 max-w-prose text-sm text-ink-2">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-surface ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "accent" | "warn" }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-2",
    accent: "bg-accent-soft text-ink",
    warn: "bg-warn-soft text-warn-ink",
  };
  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

export const inputClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none";

export const buttonClass =
  "inline-flex items-center justify-center rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-ink hover:opacity-90 disabled:opacity-50";

export const ghostButtonClass =
  "inline-flex items-center justify-center rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink hover:bg-surface-2 disabled:opacity-50";

export function Label({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-ink-2">
      {children}
    </label>
  );
}
