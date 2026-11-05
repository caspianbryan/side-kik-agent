"use client";

import { useActionState, useEffect, useRef } from "react";
import { simulateMessage, type ActionState } from "@/app/actions";
import { buttonClass, ghostButtonClass, inputClass } from "@/components/ui";

const QUICK = ["Hi", "1", "good conduct", "AGENT", "menu"];

export function SimForm({ waId, name }: { waId: string; name: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(simulateMessage, { ok: true });
  const form = useRef<HTMLFormElement>(null);
  const text = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok && !pending && text.current) text.current.value = "";
  }, [state, pending]);

  function quick(t: string) {
    if (!text.current) return;
    text.current.value = t;
    form.current?.requestSubmit();
  }

  return (
    <form ref={form} action={action} className="border-t border-line p-3">
      <input type="hidden" name="waId" value={waId} />
      <input type="hidden" name="name" value={name} />
      <div className="mb-2 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button key={q} type="button" disabled={pending} onClick={() => quick(q)} className={`${ghostButtonClass} px-2.5 py-1 text-xs`}>
            {q}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <label htmlFor="sim-text" className="sr-only">Message</label>
        <input ref={text} id="sim-text" name="text" autoComplete="off" placeholder="Type as the customer…" className={inputClass} />
        <button type="submit" disabled={pending} className={buttonClass}>{pending ? "…" : "Send"}</button>
      </div>
      {!state.ok && <p role="alert" className="mt-1.5 text-xs text-danger">{state.message}</p>}
    </form>
  );
}
