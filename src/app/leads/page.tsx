import { LEAD_STAGES } from "@/lib/constants";
import { LeadCard } from "@/components/lead-card";
import { NewLeadForm } from "@/components/new-lead-form";
import { PageHeader } from "@/components/ui";
import { getLeads, getServices } from "@/lib/queries";
import { kes } from "@/lib/format";

export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<(typeof LEAD_STAGES)[number], string> = {
  new: "New",
  contacted: "Contacted",
  paid: "Paid",
  done: "Done",
  lost: "Lost",
};

export default async function LeadsPage() {
  const [leads, services] = await Promise.all([getLeads(), getServices()]);
  const names = Object.fromEntries(services.map((s) => [s.slug, s.name]));

  return (
    <>
      <PageHeader
        title="Leads"
        lead="Done-for-you requests (the bot adds these when someone replies AGENT) and SME clients. Move them across as they progress."
      />
      <div className="mb-6">
        <NewLeadForm services={services.map((s) => ({ slug: s.slug, name: s.name, priceKes: s.priceKes }))} />
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {LEAD_STAGES.map((stage) => {
          const items = leads.filter((l) => l.stage === stage);
          const total = items.reduce((sum, l) => sum + l.amountKes, 0);
          return (
            <section key={stage} aria-label={STAGE_LABEL[stage]} className="rounded-lg bg-surface-2 p-2">
              <header className="flex items-baseline justify-between px-1 pb-2">
                <h2 className="text-sm font-semibold">
                  {STAGE_LABEL[stage]} <span className="font-normal text-ink-3">{items.length}</span>
                </h2>
                {total > 0 && <span className="text-xs tabular-nums text-ink-2">{kes(total)}</span>}
              </header>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <p className="px-1 pb-2 text-xs text-ink-3">Nothing here.</p>
                ) : (
                  items.map((l) => <LeadCard key={l.id} lead={l} serviceName={names[l.serviceSlug ?? ""]} />)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
