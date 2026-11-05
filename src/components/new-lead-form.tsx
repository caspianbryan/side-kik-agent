"use client";

import { useActionState, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { createLead, type ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function NewLeadForm({ services }: { services: { slug: string; name: string; priceKes: number }[] }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"sme" | "application">("sme");
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const result = await createLead(prev, form);
    if (result.ok) {
      setOpen(false);
      toast.success("Lead added");
    }
    return result;
  }, { ok: true });

  if (!open)
    return (
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        Add lead
      </Button>
    );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>New lead</CardTitle>
        <CardDescription>Someone you&apos;re talking to about a paid setup or application.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-5">
          <input type="hidden" name="kind" value={kind} />
          <div role="radiogroup" aria-label="Lead type" className="inline-flex rounded-md border p-0.5">
            {(["sme", "application"] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={kind === k}
                onClick={() => setKind(k)}
                className={cn(
                  "h-8 rounded px-3 text-sm transition-colors duration-150",
                  kind === k ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {k === "sme" ? "SME client" : "Application"}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="nl-name">Name</Label>
              <Input id="nl-name" name="name" required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nl-phone">Phone</Label>
              <Input id="nl-phone" name="phone" inputMode="tel" placeholder="2547…" />
            </div>
            {kind === "sme" ? (
              <div className="space-y-2">
                <Label htmlFor="nl-business">Business and offer</Label>
                <Input id="nl-business" name="business" placeholder="Salon booking bot" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="nl-service">Service</Label>
                <Select name="serviceSlug" defaultValue={services[0]?.slug}>
                  <SelectTrigger id="nl-service"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.slug} value={s.slug}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="nl-amount">{kind === "sme" ? "Setup (KES)" : "Fee (KES)"}</Label>
                <Input id="nl-amount" key={kind} name="amountKes" type="number" min={0} defaultValue={kind === "sme" ? 15000 : 300} />
              </div>
              {kind === "sme" && (
                <div className="space-y-2">
                  <Label htmlFor="nl-monthly">Monthly</Label>
                  <Input id="nl-monthly" name="monthlyKes" type="number" min={0} defaultValue={2000} />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nl-notes">Notes</Label>
            <Input id="nl-notes" name="notes" placeholder="Where you met, what they need" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add lead"}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            {!state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
