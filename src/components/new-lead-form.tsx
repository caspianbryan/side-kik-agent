"use client";

import { useActionState, useState } from "react";
import { createLead, type ActionState } from "@/app/actions";
import { buttonClass, ghostButtonClass, inputClass, Label } from "@/components/ui";

export function NewLeadForm({ services }: { services: { slug: string; name: string; priceKes: number }[] }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"sme" | "application">("sme");
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, form) => {
    const result = await createLead(prev, form);
    if (result.ok) setOpen(false); // form unmounts, so it starts empty next time
    return result;
  }, { ok: true });

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        Add lead
      </button>
    );

  return (
    <form action={action} className="w-full rounded-lg border border-line bg-surface p-4">
      <fieldset className="mb-3 flex gap-4 text-sm">
        <legend className="sr-only">Lead type</legend>
        {(["sme", "application"] as const).map((k) => (
          <label key={k} className="flex items-center gap-1.5">
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
            {k === "sme" ? "SME client" : "Application"}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="nl-name">Name</Label>
          <input id="nl-name" name="name" required className={inputClass} />
        </div>
        <div>
          <Label htmlFor="nl-phone">Phone</Label>
          <input id="nl-phone" name="phone" inputMode="tel" placeholder="2547…" className={inputClass} />
        </div>
        {kind === "sme" ? (
          <div>
            <Label htmlFor="nl-business">Business / offer</Label>
            <input id="nl-business" name="business" placeholder="e.g. Salon booking bot" className={inputClass} />
          </div>
        ) : (
          <div>
            <Label htmlFor="nl-service">Service</Label>
            <select id="nl-service" name="serviceSlug" className={inputClass}>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="nl-amount">{kind === "sme" ? "Setup (KES)" : "Fee (KES)"}</Label>
            <input id="nl-amount" name="amountKes" type="number" min={0} defaultValue={kind === "sme" ? 15000 : 300} key={kind} className={inputClass} />
          </div>
          {kind === "sme" && (
            <div>
              <Label htmlFor="nl-monthly">Monthly</Label>
              <input id="nl-monthly" name="monthlyKes" type="number" min={0} defaultValue={2000} className={inputClass} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="nl-notes">Notes</Label>
        <input id="nl-notes" name="notes" className={inputClass} />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? "Adding…" : "Add lead"}</button>
        <button type="button" onClick={() => setOpen(false)} className={ghostButtonClass}>Cancel</button>
        {!state.ok && <p role="alert" className="text-sm text-danger">{state.message}</p>}
      </div>
    </form>
  );
}
