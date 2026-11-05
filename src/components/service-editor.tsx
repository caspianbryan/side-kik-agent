"use client";

import { useActionState, useState } from "react";
import { updateService, type ActionState } from "@/app/actions";
import { WaText } from "@/components/wa-text";
import { buttonClass, inputClass, Label } from "@/components/ui";

type S = {
  id: number;
  menuKey: string;
  name: string;
  keywords: string;
  priceKes: number;
  checklist: string;
  active: boolean;
  updatedAt: string;
};

export function ServiceEditor({ service }: { service: S }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateService, { ok: true });
  const [text, setText] = useState(service.checklist);
  const id = (k: string) => `svc-${service.id}-${k}`;

  return (
    <form action={action} className="rounded-lg border border-line bg-surface p-4 md:p-5">
      <input type="hidden" name="id" value={service.id} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">
          <span className="mr-2 rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-ink-2">{service.menuKey}</span>
          {service.name}
        </h2>
        <p className="text-xs text-ink-3">
          Updated {new Date(service.updatedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end">
        <div>
          <Label htmlFor={id("name")}>Menu name</Label>
          <input id={id("name")} name="name" defaultValue={service.name} className={inputClass} />
        </div>
        <div>
          <Label htmlFor={id("kw")}>Keywords (comma separated)</Label>
          <input id={id("kw")} name="keywords" defaultValue={service.keywords} className={inputClass} />
        </div>
        <div>
          <Label htmlFor={id("price")}>Your fee (KES)</Label>
          <input id={id("price")} name="priceKes" type="number" min={0} defaultValue={service.priceKes} className={inputClass} />
        </div>
        <label htmlFor={id("active")} className="flex items-center gap-2 pb-2 text-sm">
          <input id={id("active")} name="active" type="checkbox" defaultChecked={service.active} />
          In menu
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <Label htmlFor={id("text")}>Checklist reply</Label>
          <textarea
            id={id("text")}
            name="checklist"
            rows={16}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={`${inputClass} font-mono text-[13px] leading-5`}
          />
          <p className={`mt-1 text-xs ${text.length > 3500 ? "text-danger" : "text-ink-3"}`}>
            {text.length.toLocaleString()} / 3,500 characters · *bold* and _italic_ work like in WhatsApp
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-ink-2">Preview</p>
          <div className="rounded-lg bg-surface-2 p-3">
            <div className="ml-auto max-w-[90%] whitespace-pre-wrap rounded-lg bg-bubble-out px-3 py-2 text-sm">
              <WaText text={text} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : "Save checklist"}
        </button>
        {state.message && (
          <p role="status" className={`text-sm ${state.ok ? "text-ink-2" : "text-danger"}`}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
