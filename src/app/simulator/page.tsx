import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui";
import { ScrollAnchor } from "@/components/scroll-anchor";
import { SimForm } from "@/components/sim-form";
import { WaText } from "@/components/wa-text";
import { getHubSettings, getOrders, getThreadByWaId } from "@/lib/queries";
import { clock } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const TEST_NUMBER = "254700000099";

export default async function SimulatorPage() {
  const [data, settings, orders] = await Promise.all([getThreadByWaId(TEST_NUMBER), getHubSettings(), getOrders()]);
  const thread = data?.thread ?? [];
  const shop = settings.mode === "shop";
  // Made-up M-Pesa confirmation for the test customer's latest unpaid order (demo of payment claims).
  const openOrder = data ? orders.find((o) => o.contactId === data.contact.id && o.paymentStatus === "unpaid" && o.status !== "cancelled") : undefined;
  const samplePayment = openOrder
    ? `SK${String(openOrder.id).padStart(4, "0")}DEMO Confirmed. Ksh${openOrder.totalKes.toLocaleString("en-KE")}.00 paid to ${settings.businessName.toUpperCase()}. on ${new Date().toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })} at 9:41 PM.New M-PESA balance is Ksh1,250.00.`
    : null;

  return (
    <>
      <PageHeader
        title="Simulator"
        lead="Chat with the bot as a customer would. It runs the same code as the real webhook, but nothing is sent to WhatsApp."
      />
      <div className="grid gap-8 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="mx-auto w-full max-w-sm rounded-[2rem] border bg-card p-2 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.45)]">
          <div className="flex h-[38rem] flex-col overflow-hidden rounded-[1.6rem] border">
            <header className="border-b px-4 py-3">
              <p className="text-sm font-medium">Test customer</p>
              <p className="text-xs text-muted-foreground">+254 700 000 099, demo</p>
            </header>
            <ol className="flex-1 space-y-2 overflow-y-auto bg-chat-wall px-3 py-4" aria-label="Messages">
              {thread.length === 0 && <li className="pt-10 text-center text-sm text-muted-foreground">Say “Hi” to start.</li>}
              {thread.map((m) => {
                const fromCustomer = m.direction === "in";
                return (
                  <li key={m.id} className={cn("flex", fromCustomer ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                        fromCustomer ? "rounded-br-sm bg-bubble-out" : "rounded-bl-sm border bg-bubble-in",
                      )}
                    >
                      <WaText text={m.body} />
                      <p className="mt-1 text-right text-xs text-muted-foreground">{clock(m.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
              <ScrollAnchor token={thread.length} />
            </ol>
            <SimForm waId={TEST_NUMBER} name="Demo · Test customer" mode={shop ? "shop" : "services"} samplePayment={shop ? samplePayment : null} />
          </div>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>How the bot answers</CardTitle>
          </CardHeader>
          <CardContent>
            {shop ? (
              <dl className="divide-y text-sm">
                <div className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-medium">Hi or menu</dt>
                  <dd className="text-muted-foreground">Greets with the business name: products, delivery areas, talk to a person.</dd>
                </div>
                <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-medium">1, then a product number</dt>
                  <dd className="text-muted-foreground">Asks quantity, delivery area and location, then creates an order with a code and payment instructions. Typing a product name (&ldquo;frontal&rdquo;) jumps straight to it.</dd>
                </div>
                <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-medium">A pasted M-Pesa message</dt>
                  <dd className="text-muted-foreground">
                    Marks their order as claimed paid. Verify it in <Link className="text-primary underline-offset-4 hover:underline" href="/orders">Orders</Link> → Reconcile.
                  </dd>
                </div>
                <div className="grid gap-1 py-3 last:pb-0 sm:grid-cols-[11rem_1fr]">
                  <dt className="font-medium">3, AGENT, cancel</dt>
                  <dd className="text-muted-foreground">Hands over to you, or drops the order in progress.</dd>
                </div>
              </dl>
            ) : (
            <dl className="divide-y text-sm">
              <div className="grid gap-1 py-3 first:pt-0 sm:grid-cols-[11rem_1fr]">
                <dt className="font-medium">Hi, menu, or anything unclear</dt>
                <dd className="text-muted-foreground">Sends the numbered menu of services.</dd>
              </div>
              <div className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
                <dt className="font-medium">A number or keyword</dt>
                <dd className="text-muted-foreground">Sends that service&apos;s checklist, e.g. “1”, “passport”, “good conduct”.</dd>
              </div>
              <div className="grid gap-1 py-3 last:pb-0 sm:grid-cols-[11rem_1fr]">
                <dt className="font-medium">AGENT, help, nisaidie</dt>
                <dd className="text-muted-foreground">
                  Adds a lead to <Link className="text-primary underline-offset-4 hover:underline" href="/leads">Leads</Link> and tells them a person will follow up.
                </dd>
              </div>
            </dl>
            )}
            {data && (
              <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">
                This chat also appears in the{" "}
                <Link className="text-primary underline-offset-4 hover:underline" href={`/inbox/${data.contact.id}`}>inbox</Link>, so you can practise replying.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
