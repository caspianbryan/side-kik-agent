"use client";

import { useActionState, useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { deleteZone, saveZone, type ActionState } from "@/app/shop-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Zone = { id: number; name: string; feeKes: number };

function ZoneRow({ zone }: { zone?: Zone }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [key, setKey] = useState(0);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await saveZone(prev, fd);
    if (result.ok) {
      toast.success(result.message);
      if (!zone) setKey((k) => k + 1); // clear the "add" row
    }
    return result;
  }, { ok: true });
  const id = (k: string) => `zone-${zone?.id ?? "new"}-${k}`;

  return (
    <li className="px-4 py-3 sm:px-5">
      <form key={key} action={action} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto_auto]">
        {zone && <input type="hidden" name="id" value={zone.id} />}
        <label htmlFor={id("name")} className="sr-only">Area</label>
        <Input id={id("name")} name="name" defaultValue={zone?.name} placeholder={zone ? undefined : "New area, e.g. Kasarani"} />
        <label htmlFor={id("fee")} className="sr-only">Fee in KES</label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs text-muted-foreground">KES</span>
          <Input id={id("fee")} name="feeKes" type="number" min={0} defaultValue={zone?.feeKes ?? ""} placeholder="0" className="pl-11 text-right tabular-nums" />
        </div>
        <div className="col-span-2 flex items-center gap-1 sm:col-span-1">
          <Button type="submit" size="sm" variant={zone ? "outline" : "default"} disabled={pending}>
            {zone ? (pending ? "Saving…" : "Save") : (
              <>
                <PlusIcon />
                {pending ? "Adding…" : "Add area"}
              </>
            )}
          </Button>
          {zone &&
            (confirming ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={deleting}
                onClick={() => startDelete(async () => { await deleteZone(zone.id); toast.success(`Removed ${zone.name}`); })}
              >
                Remove {zone.name.length > 14 ? "area" : zone.name}
              </Button>
            ) : (
              <Button type="button" size="icon-sm" variant="ghost" aria-label={`Remove ${zone.name}`} onClick={() => setConfirming(true)} className="text-muted-foreground hover:text-destructive">
                <Trash2Icon />
              </Button>
            ))}
        </div>
        {!state.ok && <p role="alert" className="col-span-full text-xs text-destructive">{state.message}</p>}
      </form>
    </li>
  );
}

export function ZonesEditor({ zones }: { zones: Zone[] }) {
  return (
    <section aria-labelledby="zones-h" className="space-y-4">
      <div>
        <h2 id="zones-h" className="text-base font-medium">Delivery areas</h2>
        <p className="mt-1 text-sm text-muted-foreground">The bot asks customers to pick one and adds the fee to their order. Use 0 for pick-up.</p>
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {zones.map((z) => <ZoneRow key={z.id} zone={z} />)}
        <ZoneRow />
      </ul>
    </section>
  );
}
