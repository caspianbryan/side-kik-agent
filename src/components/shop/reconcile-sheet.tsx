"use client";

import { useActionState, useState } from "react";
import { CircleCheckIcon, CircleHelpIcon, ScaleIcon, TriangleAlertIcon } from "lucide-react";
import { reconcile, type ReconcileState } from "@/app/shop-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { kes } from "@/lib/format";

/** Paste the M-Pesa messages you received; Zola matches them to orders. */
export function ReconcileSheet() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ReconcileState, FormData>(reconcile, { ok: true });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <ScaleIcon />
          Reconcile M-Pesa
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:w-[30rem] sm:max-w-[30rem]">
        <SheetHeader>
          <SheetTitle className="font-display text-h2 leading-tight font-normal">Reconcile M-Pesa</SheetTitle>
          <SheetDescription>
            Paste the payment messages from <strong className="font-medium text-foreground">your</strong> M-Pesa (SMS or statement rows).
            Zola matches each one to an order and marks it verified.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
          <form action={action} className="space-y-3">
            <Label htmlFor="rc-text">M-Pesa messages</Label>
            <Textarea
              id="rc-text"
              name="text"
              rows={8}
              className="field-sizing-fixed font-mono text-[0.8125rem] leading-6"
              placeholder={"QK51ABCD12 Confirmed. You have received Ksh9,400.00 from JANE W…\nQK61XYZW34 Confirmed. Ksh4,700.00 received…"}
            />
            <Button type="submit" disabled={pending}>{pending ? "Matching…" : "Match payments"}</Button>
            {state.message && (
              <p role="status" className={`text-sm ${state.ok ? "text-muted-foreground" : "text-destructive"}`}>{state.message}</p>
            )}
          </form>

          {state.results && state.results.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {state.results.map((r) => {
                const p = r.payment;
                let icon = <CircleHelpIcon className="size-4 text-muted-foreground" />;
                let text = "No matching order. Check it by hand.";
                if (r.kind === "verified" && r.applied) {
                  icon = <CircleCheckIcon className="size-4 text-success" />;
                  text = `Verified ${r.orderCode} (matched by ${r.how}).`;
                } else if (r.kind === "verified") {
                  icon = <TriangleAlertIcon className="size-4 text-destructive" />;
                  text = `Matches ${r.orderCode}, but this code is already on another order. Check it.`;
                } else if (r.kind === "short") {
                  icon = <TriangleAlertIcon className="size-4 text-destructive" />;
                  text = `${r.orderCode} costs ${kes(r.dueKes)}, so ${kes(r.dueKes - p.amountKes)} is still due.`;
                } else if (r.kind === "already") {
                  icon = <CircleCheckIcon className="size-4 text-muted-foreground" />;
                  text = `${r.orderCode} was already verified.`;
                } else if (r.kind === "ambiguous") {
                  icon = <TriangleAlertIcon className="size-4 text-warning-fg" />;
                  text = `Same amount as ${r.candidates.join(", ")}. Open the right order and enter this code.`;
                }
                return (
                  <li key={p.code} className="flex gap-3 px-4 py-3 text-sm">
                    <span className="mt-0.5">{icon}</span>
                    <div className="min-w-0">
                      <p>
                        <span className="font-mono">{p.code}</span> · {kes(p.amountKes)}
                      </p>
                      <p className="text-muted-foreground">{text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
