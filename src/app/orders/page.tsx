import Link from "next/link";
import { ShoppingBagIcon } from "lucide-react";
import { OrdersList } from "@/components/shop/orders-list";
import { ReconcileSheet } from "@/components/shop/reconcile-sheet";
import { PageHeader } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { PAYMENT_STATUSES, PAYMENT_STATUS_LABEL, type PaymentStatus } from "@/lib/constants";
import { getHubSettings, getOrders } from "@/lib/queries";
import { kes } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Filter = "all" | PaymentStatus;

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const sp = await searchParams;
  const filter: Filter = PAYMENT_STATUSES.includes(sp.pay as PaymentStatus) ? (sp.pay as PaymentStatus) : "all";
  const [all, settings] = await Promise.all([getOrders(), getHubSettings()]);
  const live = all.filter((o) => o.status !== "cancelled");
  const shown = all.filter((o) => filter === "all" || o.paymentStatus === filter);
  const sum = (xs: typeof all) => xs.reduce((n, o) => n + o.totalKes, 0);

  const toVerify = live.filter((o) => o.paymentStatus === "claimed" || o.paymentStatus === "mismatch");
  const verified = live.filter((o) => o.paymentStatus === "verified");
  const unpaid = live.filter((o) => o.paymentStatus === "unpaid");

  return (
    <>
      <PageHeader
        title="Orders"
        lead="Orders the bot takes on WhatsApp. When customers paste their M-Pesa message the order shows as claimed paid; reconcile against your own M-Pesa to verify."
        action={<ReconcileSheet />}
      />

      {settings.mode !== "shop" && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-warning-bg px-5 py-3.5 text-sm text-warning-fg">
          <p>The bot is in government-helper mode, so it isn&apos;t taking orders. Switch it to shop mode in Settings.</p>
          <Button asChild size="sm" variant="outline" className="border-warning-fg/40 bg-transparent text-warning-fg hover:bg-warning-fg/10 hover:text-warning-fg">
            <Link href="/settings">Open settings</Link>
          </Button>
        </div>
      )}

      <dl className="mb-8 grid divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          { label: "To verify", value: kes(sum(toVerify)), note: `${toVerify.length} claimed or flagged` },
          { label: "Verified", value: kes(sum(verified)), note: `${verified.length} order${verified.length === 1 ? "" : "s"}` },
          { label: "Awaiting payment", value: kes(sum(unpaid)), note: `${unpaid.length} order${unpaid.length === 1 ? "" : "s"}` },
        ].map((s) => (
          <div key={s.label} className="flex min-w-0 items-baseline justify-between gap-4 px-4 py-3 sm:block sm:px-6 sm:py-4">
            <dt className="truncate text-sm text-muted-foreground sm:text-xs">{s.label}</dt>
            <dd className="font-display truncate text-[1.2rem] leading-tight sm:mt-1.5 sm:text-h2">{s.value}</dd>
            <dd className="mt-1 hidden text-xs text-muted-foreground sm:block">{s.note}</dd>
          </div>
        ))}
      </dl>

      <nav aria-label="Filter by payment" className="-mx-1 mb-4 flex max-w-full gap-1 overflow-x-auto px-1 pb-1">
        {(["all", ...PAYMENT_STATUSES] as Filter[]).map((f) => {
          const active = filter === f;
          const n = f === "all" ? all.length : all.filter((o) => o.paymentStatus === f).length;
          return (
            <Link
              key={f}
              href={f === "all" ? "/orders" : `/orders?pay=${f}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors duration-150",
                active ? "border-primary/40 bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {f === "all" ? "All" : PAYMENT_STATUS_LABEL[f]}
              <span className={cn("tabular-nums text-xs", active ? "text-primary" : "text-muted-foreground")}>{n}</span>
            </Link>
          );
        })}
      </nav>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <ShoppingBagIcon className="size-6 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {all.length === 0
              ? "No orders yet. Try one in the simulator: reply 1, pick a product, a quantity and an area."
              : "No orders match this filter."}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={all.length === 0 ? "/simulator" : "/orders"}>{all.length === 0 ? "Open the simulator" : "Show all orders"}</Link>
          </Button>
        </div>
      ) : (
        <OrdersList
          orders={shown.map((o) => ({
            ...o,
            createdAt: o.createdAt.toISOString(),
            items: o.items.map((i) => ({ id: i.id, name: i.name, priceKes: i.priceKes, qty: i.qty })),
          }))}
        />
      )}
    </>
  );
}
