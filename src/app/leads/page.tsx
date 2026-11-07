import Link from "next/link";
import { SquareKanbanIcon } from "lucide-react";
import { LeadsList } from "@/components/leads-list";
import { NewLeadForm } from "@/components/new-lead-form";
import { PageHeader } from "@/components/ui";
import { LEAD_STAGES, STAGE_LABEL, type LeadStage } from "@/lib/constants";
import { getLeads, getServices } from "@/lib/queries";
import { kes } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StageFilter = "all" | LeadStage;
type KindFilter = "all" | "sme" | "application";

function href(stage: StageFilter, kind: KindFilter) {
  const p = new URLSearchParams();
  if (stage !== "all") p.set("stage", stage);
  if (kind !== "all") p.set("kind", kind);
  const q = p.toString();
  return q ? `/leads?${q}` : "/leads";
}

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const sp = await searchParams;
  const stage: StageFilter = LEAD_STAGES.includes(sp.stage as LeadStage) ? (sp.stage as LeadStage) : "all";
  const kind: KindFilter = sp.kind === "sme" || sp.kind === "application" ? sp.kind : "all";

  const [all, services] = await Promise.all([getLeads(), getServices()]);
  const names = Object.fromEntries(services.map((s) => [s.slug, s.name]));

  const byKind = all.filter((l) => kind === "all" || l.kind === kind);
  const shown = byKind.filter((l) => stage === "all" || l.stage === stage);
  const count = (s: LeadStage) => byKind.filter((l) => l.stage === s).length;

  const open = all.filter((l) => l.stage === "new" || l.stage === "contacted");
  const won = all.filter((l) => l.stage === "paid" || l.stage === "done");
  const sum = (xs: typeof all, k: "amountKes" | "monthlyKes") => xs.reduce((n, l) => n + l[k], 0);

  const tabs: { key: StageFilter; label: string; n: number }[] = [
    { key: "all", label: "All", n: byKind.length },
    ...LEAD_STAGES.map((s) => ({ key: s, label: STAGE_LABEL[s], n: count(s) })),
  ];

  return (
    <>
      <PageHeader
        title="Leads"
        lead="Done-for-you requests arrive here when someone replies AGENT. Add SME clients yourself, then move each one along."
        action={<NewLeadForm services={services.map((s) => ({ slug: s.slug, name: s.name, priceKes: s.priceKes }))} />}
      />

      <dl className="mb-8 grid divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          { label: "In the pipeline", value: kes(sum(open, "amountKes")), note: `${open.length} open` },
          { label: "Won", value: kes(sum(won, "amountKes")), note: `${won.length} paid or done` },
          { label: "Monthly recurring", value: kes(sum(won, "monthlyKes")), note: "from SME clients" },
        ].map((s) => (
          <div key={s.label} className="flex min-w-0 items-baseline justify-between gap-4 px-4 py-3 sm:block sm:px-6 sm:py-4">
            <dt className="truncate text-sm text-muted-foreground sm:text-xs">{s.label}</dt>
            <dd className="font-display truncate text-[1.2rem] leading-tight sm:mt-1.5 sm:text-h2">{s.value}</dd>
            <dd className="mt-1 hidden text-xs text-muted-foreground sm:block">{s.note}</dd>
          </div>
        ))}
      </dl>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by stage" className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1">
          {tabs.map((t) => {
            const active = stage === t.key;
            return (
              <Link
                key={t.key}
                href={href(t.key, kind)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors duration-150",
                  active ? "border-primary/40 bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {t.label}
                <span className={cn("tabular-nums text-xs", active ? "text-primary" : "text-muted-foreground")}>{t.n}</span>
              </Link>
            );
          })}
        </nav>

        <div role="group" aria-label="Filter by type" className="inline-flex rounded-md border p-0.5">
          {(["all", "sme", "application"] as const).map((k) => (
            <Link
              key={k}
              href={href(stage, k)}
              aria-current={kind === k ? "true" : undefined}
              className={cn(
                "inline-flex h-7 items-center rounded px-2.5 text-xs transition-colors duration-150",
                kind === k ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {k === "all" ? "All types" : k === "sme" ? "SME" : "Applications"}
            </Link>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <SquareKanbanIcon className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {all.length === 0
              ? "No leads yet. They appear when someone replies AGENT, or add one yourself."
              : "No leads match this filter."}
          </p>
          {all.length > 0 && (
            <Link href="/leads" className="text-sm text-primary underline-offset-4 hover:underline">
              Show all leads
            </Link>
          )}
        </div>
      ) : (
        <LeadsList
          serviceNames={names}
          leads={shown.map((l) => ({ ...l, updatedAt: l.updatedAt.toISOString() }))}
        />
      )}
    </>
  );
}
