"use client";

import { useActionState, useState, useTransition } from "react";
import { toast } from "sonner";
import { loadDemoShop, saveSettings, type ActionState } from "@/app/shop-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BotMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MODES: { value: BotMode; title: string; body: string }[] = [
  { value: "services", title: "Government services helper", body: "Menu of services, step-by-step checklists, AGENT hands over to you." },
  { value: "shop", title: "Shop", body: "Products and prices, delivery areas, orders with M-Pesa payment and reconciliation." },
];

export function SettingsForm({
  initial,
}: {
  initial: { mode: BotMode; businessName: string; greeting: string; paymentInstructions: string };
}) {
  const [mode, setMode] = useState<BotMode>(initial.mode);
  const [loading, startLoad] = useTransition();
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await saveSettings(prev, fd);
    if (result.ok) toast.success("Settings saved", { description: `The bot now runs as a ${fd.get("mode") === "shop" ? "shop" : "services helper"}.` });
    return result;
  }, { ok: true });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="mode" value={mode} />
      <Card>
        <CardHeader>
          <CardTitle>What the bot does</CardTitle>
          <CardDescription>Applies to every new message on your number.</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" aria-label="Bot mode" className="grid gap-3 sm:grid-cols-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                onClick={() => setMode(m.value)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  mode === m.value ? "border-primary/60 bg-primary/[0.06]" : "hover:bg-accent/50",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span aria-hidden className={cn("flex size-4 items-center justify-center rounded-full border", mode === m.value && "border-primary")}>
                    {mode === m.value && <span className="size-2 rounded-full bg-primary" />}
                  </span>
                  {m.title}
                </span>
                <span className="mt-1.5 block pl-6 text-sm text-muted-foreground">{m.body}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
          <CardDescription>Used in the shop greeting and on every order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="st-name">Business name</Label>
              <Input id="st-name" name="businessName" defaultValue={initial.businessName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-greet">Line under the greeting</Label>
              <Input id="st-greet" name="greeting" defaultValue={initial.greeting} placeholder="Open Mon–Sat, 8am–8pm. Same-day delivery in Nairobi." />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="st-pay">How customers pay</Label>
            <Textarea id="st-pay" name="paymentInstructions" rows={2} defaultValue={initial.paymentInstructions} placeholder="Lipa na M-Pesa Till 123456 (MAMA WIGS)" />
            <p className="text-xs text-muted-foreground">Shown with every order, together with the order code to use as the account number on paybills.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
        {!state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demo shop</CardTitle>
          <CardDescription>
            Adds 5 sample wig products and Nairobi delivery areas so you can demo the shop bot to a client. Demo products are
            marked and removed by &ldquo;Clear demo data&rdquo; on the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() =>
              startLoad(async () => {
                await loadDemoShop();
                toast.success("Demo shop loaded", { description: "See it under Products, then try it in the Simulator." });
              })
            }
          >
            {loading ? "Loading…" : "Load demo shop"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
