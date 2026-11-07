import { SettingsForm } from "@/components/shop/settings-form";
import { PageHeader } from "@/components/ui";
import { getHubSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getHubSettings();
  return (
    <>
      <PageHeader title="Settings" lead="Choose what the bot does and how it introduces your business." />
      <div className="max-w-3xl">
        <SettingsForm
          initial={{ mode: s.mode, businessName: s.businessName, greeting: s.greeting, paymentInstructions: s.paymentInstructions }}
        />
      </div>
    </>
  );
}
