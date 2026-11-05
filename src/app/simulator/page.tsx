import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { SimForm } from "@/components/sim-form";
import { ScrollAnchor } from "@/components/scroll-anchor";
import { WaText } from "@/components/wa-text";
import { getThreadByWaId } from "@/lib/queries";
import { clock } from "@/lib/format";

export const dynamic = "force-dynamic";

const TEST_NUMBER = "254700000099";

export default async function SimulatorPage() {
  const data = await getThreadByWaId(TEST_NUMBER);
  const thread = data?.thread ?? [];

  return (
    <>
      <PageHeader
        title="Simulator"
        lead="Chat with the bot as a customer would. Runs the same code as the real webhook, but nothing is sent to WhatsApp. Chats here are marked as demo."
      />
      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card className="flex h-[36rem] flex-col overflow-hidden">
          <header className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Demo · Test customer</p>
            <p className="text-xs text-ink-3">+254 700 000 099</p>
          </header>
          <ol className="flex-1 space-y-2 overflow-y-auto bg-surface-2 px-3 py-3" aria-label="Messages">
            {thread.length === 0 && (
              <li className="pt-8 text-center text-sm text-ink-3">Say “Hi” to start.</li>
            )}
            {thread.map((m) => {
              const fromCustomer = m.direction === "in";
              return (
                <li key={m.id} className={`flex ${fromCustomer ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                      fromCustomer ? "bg-bubble-out" : "bg-bubble-in"
                    }`}
                  >
                    <WaText text={m.body} />
                    <p className="mt-1 text-right text-[11px] text-ink-3">{clock(m.createdAt)}</p>
                  </div>
                </li>
              );
            })}
            <ScrollAnchor token={thread.length} />
          </ol>
          <SimForm waId={TEST_NUMBER} name="Demo · Test customer" />
        </Card>

        <Card className="h-fit p-5 text-sm leading-6 text-ink-2">
          <h2 className="mb-2 text-sm font-semibold text-ink">How the bot answers</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><b className="text-ink">Hi / menu / anything unclear</b> → the numbered menu.</li>
            <li><b className="text-ink">A number or keyword</b> (“1”, “passport”, “good conduct”) → that checklist.</li>
            <li><b className="text-ink">AGENT / help / nisaidie</b> → creates a lead in <Link className="text-accent underline" href="/leads">Leads</Link> and tells them a person will follow up.</li>
          </ul>
          {data && (
            <p className="mt-4">
              This chat also shows in the{" "}
              <Link className="text-accent underline" href={`/inbox/${data.contact.id}`}>Inbox</Link>, so you can practise replying.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
