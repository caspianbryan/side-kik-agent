"use client";

import { useState, useTransition } from "react";
import { ChevronRightIcon } from "lucide-react";
import { setOrderStatus } from "@/app/shop-actions";
import { OrderSheet } from "@/components/shop/order-sheet";
import { PaymentBadge } from "@/components/shop/payment-badge";
import type { OrderView } from "@/components/shop/types";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/constants";
import { kes, phone, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

function StatusSelect({ order }: { order: OrderView }) {
  const [pending, start] = useTransition();
  return (
    <Select value={order.status} disabled={pending} onValueChange={(v) => start(() => setOrderStatus(order.id, v as OrderStatus))}>
      <SelectTrigger size="sm" aria-label={`Status for ${order.code}`} className={cn("w-[8.5rem] bg-background", pending && "opacity-60")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>{ORDER_STATUS_LABEL[s]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const COLS = "lg:grid-cols-[8.5rem_minmax(0,1.3fr)_minmax(0,1.4fr)_7.5rem_8rem_9rem_4.5rem_1.25rem]";

export function OrdersList({ orders }: { orders: OrderView[] }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = orders.find((o) => o.id === openId) ?? null;

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className={cn("hidden gap-4 border-b px-5 py-3 text-xs text-muted-foreground lg:grid", COLS)}>
          <span>Order</span>
          <span>Customer</span>
          <span>Items</span>
          <span className="text-right">Total</span>
          <span>Payment</span>
          <span>Status</span>
          <span>Placed</span>
          <span className="sr-only">Open</span>
        </div>
        <ul>
          {orders.map((o) => {
            const items = o.items.map((i) => `${i.qty} × ${i.name}`).join(", ");
            return (
              <li key={o.id} className="border-b last:border-b-0">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={`Open order ${o.code}`}
                  onClick={() => setOpenId(o.id)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenId(o.id);
                    }
                  }}
                  className={cn(
                    "group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 px-4 py-4 transition-colors duration-150 outline-none hover:bg-accent/50 focus-visible:bg-accent/60 sm:px-5 lg:gap-y-0",
                    COLS,
                  )}
                >
                  <p className="flex items-center gap-2 font-mono text-sm whitespace-nowrap">
                    {o.code}
                    {o.isDemo && <Badge variant="warning" className="font-sans">Demo</Badge>}
                  </p>
                  <p className="font-display text-right text-[1.0625rem] leading-tight lg:hidden">{kes(o.totalKes)}</p>

                  <div className="col-span-2 min-w-0 lg:col-span-1">
                    <p className="truncate text-sm font-medium">{o.customerName || "Customer"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {o.phone ? phone(o.phone) : ""}
                      {o.zoneName ? ` · ${o.zoneName}` : ""}
                    </p>
                  </div>

                  <p className="col-span-2 truncate text-sm text-muted-foreground lg:col-span-1">{items}</p>

                  <p className="font-display hidden text-right text-[1.0625rem] leading-tight lg:block">{kes(o.totalKes)}</p>

                  <div className="lg:block">
                    <PaymentBadge status={o.paymentStatus} />
                  </div>

                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} className="justify-self-end lg:justify-self-auto">
                    <StatusSelect order={o} />
                  </div>

                  <p className="hidden text-xs text-muted-foreground lg:block">{timeAgo(o.createdAt)}</p>
                  <ChevronRightIcon className="hidden size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 lg:block" />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <OrderSheet order={open} onOpenChange={(o) => !o && setOpenId(null)} />
    </>
  );
}
