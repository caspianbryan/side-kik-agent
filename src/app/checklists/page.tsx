import { ServiceEditor } from "@/components/service-editor";
import { PageHeader } from "@/components/ui";
import { getServices } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ChecklistsPage() {
  const services = await getServices();
  return (
    <>
      <PageHeader
        title="Checklists"
        lead="What the bot sends for each service. Check fees on the official sites before going live, and update here whenever a rule changes."
      />
      <div className="space-y-6">
        {services.map((s) => (
          <ServiceEditor key={s.id} service={{ ...s, updatedAt: s.updatedAt.toISOString() }} />
        ))}
      </div>
    </>
  );
}
