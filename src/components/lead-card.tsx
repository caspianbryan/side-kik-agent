"use client";

import { useActionState, useState, useTransition } from "react";
import { ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import { moveLead, updateLead, type ActionState } from "@/app/actions";
import { LEAD_STAGES, STAGE_LABEL, type LeadRow as Lead, type LeadStage } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { kes, phone } from "@/lib/format";
import { cn } from "@/lib/utils";

export function LeadCard({ lead, serviceName }: { lead: Lead; serviceName?: string }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [, action, saving] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await updateLead(prev, fd);
    if (result.ok) {
      toast.success(`Saved ${lead.name}`);
      setEditing(false);
    } else toast.error(result.message);
    return result;
  }, { ok: true });
  const f = (k: string) => `lead-${lead.id}-${k}`;

  return (
    <article className={cn("relative rounded-lg border bg-card p-3.5 transition-opacity duration-150", pending && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{lead.name}</p>
        <Badge variant={lead.kind === "sme" ? "default" : "secondary"}>{lead.kind === "sme" ? "SME" : "Application"}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{lead.kind === "sme" ? lead.business : serviceName ?? lead.serviceSlug}</p>
      {lead.phone && <p className="text-xs text-muted-foreground">{phone(lead.phone)}</p>}

      <p className="font-display mt-3 text-[1.2rem] leading-tight">
        {kes(lead.amountKes)}
        {lead.monthlyKes > 0 && <span className="font-sans text-sm text-muted-foreground"> + {kes(lead.monthlyKes)}/mo</span>}
      </p>
      {lead.isDemo && <Badge variant="warning" className="mt-2">Demo</Badge>}

      <div className="mt-3 flex items-center gap-2">
        <Label htmlFor={f("move")} className="sr-only">Stage</Label>
        <Select value={lead.stage} disabled={pending} onValueChange={(v) => start(() => moveLead(lead.id, v as LeadStage))}>
          <SelectTrigger id={f("move")} size="sm" className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEAD_STAGES.map((s) => (
              <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-expanded={editing}
          aria-controls={f("edit")}
          onClick={() => setEditing((e) => !e)}
          className="text-muted-foreground"
        >
          Edit
          <ChevronDownIcon className={cn("transition-transform duration-150", editing && "rotate-180")} />
        </Button>
      </div>

      {editing && (
        <form id={f("edit")} action={action} className="mt-3 space-y-3 border-t pt-3">
          <input type="hidden" name="id" value={lead.id} />
          <input type="hidden" name="stage" value={lead.stage} />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor={f("amount")} className="text-xs text-muted-foreground">Amount (KES)</Label>
              <Input id={f("amount")} name="amountKes" type="number" min={0} defaultValue={lead.amountKes} className="h-8" />
            </div>
            {lead.kind === "sme" && (
              <div className="space-y-1.5">
                <Label htmlFor={f("monthly")} className="text-xs text-muted-foreground">Monthly (KES)</Label>
                <Input id={f("monthly")} name="monthlyKes" type="number" min={0} defaultValue={lead.monthlyKes} className="h-8" />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={f("notes")} className="text-xs text-muted-foreground">Notes</Label>
            <Textarea id={f("notes")} name="notes" rows={3} defaultValue={lead.notes} />
          </div>
          <Button type="submit" size="sm" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save lead"}
          </Button>
        </form>
      )}
    </article>
  );
}
