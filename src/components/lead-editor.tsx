"use client";

import { useActionState } from "react";
import Link from "next/link";
import { MessagesSquareIcon } from "lucide-react";
import { toast } from "sonner";
import { updateLead, type ActionState } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { LEAD_STAGES, STAGE_LABEL, type LeadRow } from "@/lib/constants";
import { phone } from "@/lib/format";

/** Slide-over for editing one lead: stage, amounts and notes. */
export function LeadEditor({
  lead,
  serviceName,
  onOpenChange,
}: {
  lead: LeadRow | null;
  serviceName?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await updateLead(prev, fd);
    if (result.ok) {
      toast.success(`Saved ${fd.get("name")}`);
      onOpenChange(false);
    }
    return result;
  }, { ok: true });

  return (
    <Sheet open={!!lead} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 sm:w-[26rem] sm:max-w-[26rem]">
        {lead && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2">
                <Badge variant={lead.kind === "sme" ? "default" : "secondary"}>{lead.kind === "sme" ? "SME client" : "Application"}</Badge>
                {lead.isDemo && <Badge variant="warning">Demo</Badge>}
              </div>
              <SheetTitle className="font-display text-h2 leading-tight font-normal">{lead.name}</SheetTitle>
              <SheetDescription>
                {lead.kind === "sme" ? lead.business : serviceName ?? lead.serviceSlug}
                {lead.phone && <span className="block">{phone(lead.phone)}</span>}
              </SheetDescription>
            </SheetHeader>

            <form key={lead.id} action={action} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
              <input type="hidden" name="id" value={lead.id} />
              <input type="hidden" name="name" value={lead.name} />

              <div className="space-y-2">
                <Label htmlFor="le-stage">Stage</Label>
                <Select name="stage" defaultValue={lead.stage}>
                  <SelectTrigger id="le-stage"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{STAGE_LABEL[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="le-amount">{lead.kind === "sme" ? "Setup (KES)" : "Fee (KES)"}</Label>
                  <Input id="le-amount" name="amountKes" type="number" min={0} defaultValue={lead.amountKes} />
                </div>
                {lead.kind === "sme" && (
                  <div className="space-y-2">
                    <Label htmlFor="le-monthly">Monthly (KES)</Label>
                    <Input id="le-monthly" name="monthlyKes" type="number" min={0} defaultValue={lead.monthlyKes} />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="le-notes">Notes</Label>
                <Textarea id="le-notes" name="notes" rows={6} defaultValue={lead.notes} placeholder="What they need, what you agreed, next step" />
              </div>

              {lead.contactId && (
                <Button asChild variant="outline" className="justify-start">
                  <Link href={`/inbox/${lead.contactId}`}>
                    <MessagesSquareIcon />
                    Open their chat
                  </Link>
                </Button>
              )}

              <div className="mt-auto flex items-center gap-2 border-t pt-5">
                <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save lead"}</Button>
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
