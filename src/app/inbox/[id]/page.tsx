import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { ReplyBox } from "@/components/reply-box";
import { ScrollAnchor } from "@/components/scroll-anchor";
import { WaText } from "@/components/wa-text";
import { getThread } from "@/lib/queries";
import { isLive } from "@/lib/whatsapp";
import { clock, kes, phone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: PageProps<"/inbox/[id]">) {
  const { id } = await params;
  const data = await getThread(Number(id));
  if (!data) notFound();
  const { contact, thread, leads } = data;

  return (
    <Card className="flex h-[calc(100vh-8rem)] min-h-[28rem] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/inbox" className="text-sm text-ink-2 md:hidden" aria-label="Back to inbox">
            ←
          </Link>
          <div>
            <p className="text-sm font-semibold">{contact.name || phone(contact.waId)}</p>
            <p className="text-xs text-ink-3">{phone(contact.waId)}</p>
          </div>
          {contact.isDemo && <Badge tone="warn">Demo</Badge>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {leads.map((l) => (
            <Link key={l.id} href="/leads">
              <Badge tone={l.stage === "paid" || l.stage === "done" ? "accent" : "neutral"}>
                Lead · {l.stage} · {kes(l.amountKes)}
              </Badge>
            </Link>
          ))}
        </div>
      </header>

      <ol className="flex-1 space-y-2 overflow-y-auto bg-surface-2 px-4 py-4" aria-label="Messages">
        {thread.map((m) => {
          const out = m.direction === "out";
          return (
            <li key={m.id} className={`flex ${out ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm shadow-[0_1px_0_var(--border)] ${
                  out ? "bg-bubble-out" : "bg-bubble-in"
                }`}
              >
                <WaText text={m.body} />
                <p className="mt-1 text-right text-[11px] text-ink-3">
                  {out && (m.author === "bot" ? "Bot · " : "You · ")}
                  {clock(m.createdAt)}
                  {m.deliveryStatus === "failed" && <span className="text-danger"> · not delivered</span>}
                </p>
              </div>
            </li>
          );
        })}
        <ScrollAnchor token={thread.length} />
      </ol>

      <ReplyBox contactId={contact.id} live={isLive() && !contact.isDemo} />
    </Card>
  );
}
