import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReplyBox } from "@/components/reply-box";
import { ScrollAnchor } from "@/components/scroll-anchor";
import { WaText } from "@/components/wa-text";
import { getThread } from "@/lib/queries";
import { isLive } from "@/lib/whatsapp";
import { clock, initials, kes, phone } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: PageProps<"/inbox/[id]">) {
  const { id } = await params;
  const data = await getThread(Number(id));
  if (!data) notFound();
  const { contact, thread, leads } = data;

  return (
    <section className="flex h-[calc(100vh-7.5rem)] min-h-[30rem] flex-col overflow-hidden rounded-xl border bg-card md:h-[calc(100vh-11rem)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm" className="md:hidden">
            <Link href="/inbox" aria-label="Back to inbox"><ArrowLeftIcon /></Link>
          </Button>
          <Avatar className="size-9">
            <AvatarFallback>{initials(contact.name, "#")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{contact.name || phone(contact.waId)}</p>
            <p className="text-xs text-muted-foreground">{phone(contact.waId)}</p>
          </div>
          {contact.isDemo && <Badge variant="warning">Demo</Badge>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {leads.map((l) => (
            <Badge key={l.id} asChild variant={l.stage === "paid" || l.stage === "done" ? "success" : "outline"}>
              <Link href="/leads">Lead: {l.stage}, {kes(l.amountKes)}</Link>
            </Badge>
          ))}
        </div>
      </header>

      <ol className="flex-1 space-y-2 overflow-y-auto bg-chat-wall px-4 py-5" aria-label="Messages">
        {thread.map((m) => {
          const out = m.direction === "out";
          return (
            <li key={m.id} className={cn("flex", out ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                  out ? "rounded-br-sm bg-bubble-out" : "rounded-bl-sm border bg-bubble-in",
                )}
              >
                <WaText text={m.body} />
                <p className="mt-1 text-right text-xs text-muted-foreground">
                  {out && (m.author === "bot" ? "Bot, " : "You, ")}
                  {clock(m.createdAt)}
                  {m.deliveryStatus === "failed" && <span className="text-destructive"> (not delivered)</span>}
                </p>
              </div>
            </li>
          );
        })}
        <ScrollAnchor token={thread.length} />
      </ol>

      <ReplyBox contactId={contact.id} live={isLive() && !contact.isDemo} />
    </section>
  );
}
