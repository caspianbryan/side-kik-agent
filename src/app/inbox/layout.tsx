import { ContactList } from "@/components/contact-list";
import { getInbox } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function InboxLayout({ children }: LayoutProps<"/inbox">) {
  const contacts = await getInbox();
  return (
    <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
      <ContactList
        contacts={contacts.map((c) => ({ ...c, lastAt: c.lastAt ? new Date(c.lastAt).toISOString() : null }))}
      />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
