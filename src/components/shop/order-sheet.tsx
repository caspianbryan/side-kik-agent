"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MessagesSquareIcon } from "lucide-react";
import { toast } from "sonner";
import { saveOrder, type ActionState } from "@/app/shop-actions";
import { PaymentBadge } from "@/components/shop/payment-badge";
import type { OrderView } from "@/components/shop/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, PAYMENT_STATUSES, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { kes, phone } from "@/lib/format";

export function OrderSheet({ order, onOpenChange }: { order: OrderView | null; onOpenChange: (open: boolean) => void }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await saveOrder(prev, fd);
    if (result.ok) {
      toast.success(`Saved ${fd.get("code")}`);
      onOpenChange(false);
    }
    return result;
  }, { ok: true });

  return (
    <Sheet open={!!order} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:w-[28rem] sm:max-w-[28rem]">
        {order && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2">
                <PaymentBadge status={order.paymentStatus} />
                {order.isDemo && <Badge variant="warning">Demo</Badge>}
              </div>
              <SheetTitle className="font-display text-h2 leading-tight font-normal">{order.code}</SheetTitle>
              <SheetDescription>
                {order.customerName || "Customer"}
                {order.phone && <span className="block">{phone(order.phone)}</span>}
              </SheetDescription>
            </SheetHeader>

            <form key={order.id} action={action} className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
              <input type="hidden" name="id" value={order.id} />
              <input type="hidden" name="code" value={order.code} />

              <section aria-label="Items" className="space-y-2 text-sm">
                {order.items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-3">
                    <span>{i.qty} × {i.name}</span>
                    <span className="tabular-nums">{kes(i.priceKes * i.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <span>Delivery{order.zoneName ? ` (${order.zoneName})` : ""}</span>
                  <span className="tabular-nums">{order.deliveryFeeKes ? kes(order.deliveryFeeKes) : "Free"}</span>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t pt-2">
                  <span className="font-medium">Total</span>
                  <span className="font-display text-h3">{kes(order.totalKes)}</span>
                </div>
                {order.address && <p className="pt-1 text-muted-foreground">Deliver to: {order.address}</p>}
              </section>

              <section aria-label="Payment" className="space-y-4 rounded-lg border p-4">
                <p className="text-sm font-medium">Payment</p>
                {order.paymentStatus === "verified" && order.mpesaCode ? (
                  <p className="text-sm text-muted-foreground">
                    Matched to your M-Pesa: <span className="font-mono text-foreground">{order.mpesaCode}</span>
                    {order.mpesaAmountKes != null && <> for {kes(order.mpesaAmountKes)}</>}.
                  </p>
                ) : order.mpesaCode ? (
                  <p className="text-sm text-muted-foreground">
                    {order.paymentStatus === "mismatch" ? "Payment doesn't add up: " : "Customer sent "}
                    <span className="font-mono text-foreground">{order.mpesaCode}</span>
                    {order.mpesaAmountKes != null && <> for {kes(order.mpesaAmountKes)}</>}.
                    {" "}Check it against your own M-Pesa before delivering.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No M-Pesa message from the customer yet.</p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="os-pay">Status</Label>
                    <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                      <SelectTrigger id="os-pay"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="os-code">M-Pesa code</Label>
                    <Input id="os-code" name="mpesaCode" defaultValue={order.mpesaCode ?? ""} className="font-mono uppercase" maxLength={10} />
                  </div>
                </div>
              </section>

              <div className="space-y-2">
                <Label htmlFor="os-status">Order status</Label>
                <Select name="status" defaultValue={order.status}>
                  <SelectTrigger id="os-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{ORDER_STATUS_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="os-notes">Notes</Label>
                <Textarea id="os-notes" name="notes" rows={3} defaultValue={order.notes} placeholder="Rider, delivery time, anything to remember" />
              </div>

              {order.contactId && (
                <Button asChild variant="outline" className="justify-start">
                  <Link href={`/inbox/${order.contactId}`}>
                    <MessagesSquareIcon />
                    Open their chat
                  </Link>
                </Button>
              )}

              <div className="mt-auto flex items-center gap-2 border-t pt-5">
                <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save order"}</Button>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                {!state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
              </div>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
