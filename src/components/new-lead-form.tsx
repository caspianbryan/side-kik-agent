"use client";

import { useActionState, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { createLead, type ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** "Add lead" button that opens a slide-over form. */
export function NewLeadForm({ services }: { services: { slug: string; name: string; priceKes: number }[] }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"sme" | "application">("sme");
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const result = await createLead(prev, form);
    if (result.ok) {
      setOpen(false);
      toast.success(`Added ${form.get("name")}`);
    }
    return result;
  }, { ok: true });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon />
          Add lead
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 sm:w-[26rem] sm:max-w-[26rem]">
        <SheetHeader>
          <SheetTitle className="font-display text-h2 leading-tight font-normal">New lead</SheetTitle>
          <SheetDescription>Someone you&apos;re talking to about a paid setup or application.</SheetDescription>
        </SheetHeader>

        <form action={action} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
          <input type="hidden" name="kind" value={kind} />
          <div role="radiogroup" aria-label="Lead type" className="grid grid-cols-2 rounded-md border p-0.5">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nl-amount">{kind === "sme" ? "Setup (KES)" : "Fee (KES)"}</Label>
              <Input id="nl-amount" key={kind} name="amountKes" type="number" min={0} defaultValue={kind === "sme" ? 15000 : 300} />
            </div>
            {kind === "sme" && (
              <div className="space-y-2">
                <Label htmlFor="nl-monthly">Monthly (KES)</Label>
                <Input id="nl-monthly" name="monthlyKes" type="number" min={0} defaultValue={2000} />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nl-notes">Notes</Label>
            <Textarea id="nl-notes" name="notes" rows={4} placeholder="Where you met, what they need" />
          </div>

          <div className="mt-auto flex items-center gap-2 border-t pt-5">
            <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add lead"}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            {!state.ok && <p role="alert" className="text-sm text-destructive">{state.message}</p>}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
