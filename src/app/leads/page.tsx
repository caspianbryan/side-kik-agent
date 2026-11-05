import { LeadCard } from "@/components/lead-card";
import { NewLeadForm } from "@/components/new-lead-form";
import { PageHeader } from "@/components/ui";
import { LEAD_STAGES, STAGE_LABEL } from "@/lib/constants";
import { getLeads, getServices } from "@/lib/queries";
import { kes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const [leads, services] = await Promise.all([getLeads(), getServices()]);
  const names = Object.fromEntries(services.map((s) => [s.slug, s.name]));

  return (
    <>
      <PageHeader
        title="Leads"
        lead="Done-for-you requests arrive here when someone replies AGENT. Add SME clients yourself, then move each one along as it progresses."
      />
      <div className="mb-8">
        <NewLeadForm services={services.map((s) => ({ slug: s.slug, name: s.name, priceKes: s.priceKes }))} />
      </div>

      <div className="relative -mx-4 overflow-x-auto px-4 pb-2 md:-mx-10 md:px-10">
      <div className="grid w-max grid-cols-[repeat(5,17rem)] items-start gap-4 2xl:w-full 2xl:grid-cols-5">
        {LEAD_STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage);
          const total = items.reduce((sum, l) => sum + l.amountKes, 0);
          return (
            <section key={stage} aria-label={STAGE_LABEL[stage]} className="min-w-0 rounded-xl bg-secondary/50 p-2">
              <header className="flex items-baseline justify-between gap-2 px-1.5 pt-1 pb-3">
                <h2 className="text-sm font-medium">
                  {STAGE_LABEL[stage]} <span className="ml-1 text-muted-foreground tabular-nums">{items.length}</span>
                </h2>
                {total > 0 && <span className="text-xs text-muted-foreground tabular-nums">{kes(total)}</span>}
              </header>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">Nothing here yet</p>
                ) : (
                  items.map((l) => <LeadCard key={l.id} lead={l} serviceName={names[l.serviceSlug ?? ""]} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
      </div>
    </>
  );
}
