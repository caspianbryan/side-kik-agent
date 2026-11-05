"use client";

import { useActionState, useTransition } from "react";
import { moveLead, updateLead, type ActionState } from "@/app/actions";
import { LEAD_STAGES, type LeadRow as Lead, type LeadStage } from "@/lib/constants";
import { Badge, buttonClass, inputClass, Label } from "@/components/ui";
import { kes, phone } from "@/lib/format";

export function LeadCard({ lead, serviceName }: { lead: Lead; serviceName?: string }) {
  const [pending, start] = useTransition();
  const [state, action, saving] = useActionState<ActionState, FormData>(updateLead, { ok: true });
  const f = (k: string) => `lead-${lead.id}-${k}`;

  return (
    <article className={`rounded-md border border-line bg-surface p-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{lead.name}</p>
        <Badge tone={lead.kind === "sme" ? "accent" : "neutral"}>{lead.kind === "sme" ? "SME" : "Application"}</Badge>
      </div>
      <p className="mt-0.5 text-xs text-ink-2">
        {lead.kind === "sme" ? lead.business : serviceName ?? lead.serviceSlug}
      </p>
      {lead.phone && <p className="text-xs text-ink-3">{phone(lead.phone)}</p>}
      <p className="mt-2 text-sm tabular-nums">
        {kes(lead.amountKes)}
        {lead.monthlyKes > 0 && <span className="text-ink-2"> + {kes(lead.monthlyKes)}/mo</span>}
      </p>
      {lead.isDemo && <p className="mt-1"><Badge tone="warn">Demo</Badge></p>}

      <label htmlFor={f("move")} className="mt-2 block text-xs text-ink-3">Stage</label>
      <select
        id={f("move")}
        value={lead.stage}
        disabled={pending}
        onChange={(e) => start(() => moveLead(lead.id, e.target.value as LeadStage))}
        className={`${inputClass} mt-1 py-1.5 text-xs capitalize`}
      >
        {LEAD_STAGES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-ink-2 hover:text-ink">Edit amount & notes</summary>
        <form action={action} className="mt-2 space-y-2">
          <input type="hidden" name="id" value={lead.id} />
          <input type="hidden" name="stage" value={lead.stage} />
          <div>
            <Label htmlFor={f("amount")}>Amount (KES)</Label>
            <input id={f("amount")} name="amountKes" type="number" min={0} defaultValue={lead.amountKes} className={inputClass} />
          </div>
          {lead.kind === "sme" && (
            <div>
              <Label htmlFor={f("monthly")}>Monthly (KES)</Label>
              <input id={f("monthly")} name="monthlyKes" type="number" min={0} defaultValue={lead.monthlyKes} className={inputClass} />
            </div>
          )}
          <div>
            <Label htmlFor={f("notes")}>Notes</Label>
            <textarea id={f("notes")} name="notes" rows={3} defaultValue={lead.notes} className={inputClass} />
          </div>
          <button type="submit" disabled={saving} className={`${buttonClass} w-full`}>
            {saving ? "Saving…" : "Save lead"}
          </button>
          {state.message && (
            <p role="status" className={`text-xs ${state.ok ? "text-ink-3" : "text-danger"}`}>{state.message}</p>
          )}
        </form>
      </details>
    </article>
  );
}
