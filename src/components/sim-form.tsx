"use client";

import { useActionState, useRef } from "react";
import { SendHorizontalIcon } from "lucide-react";
import { simulateMessage, type ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const QUICK = ["Hi", "1", "good conduct", "AGENT", "menu"];

export function SimForm({ waId, name }: { waId: string; name: string }) {
  const form = useRef<HTMLFormElement>(null);
  const text = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await simulateMessage(prev, fd);
    if (result.ok && text.current) text.current.value = "";
    return result;
  }, { ok: true });

  function quick(t: string) {
    if (!text.current) return;
    text.current.value = t;
    form.current?.requestSubmit();
  }

  return (
    <form ref={form} action={action} className="space-y-2.5 border-t p-3">
      <input type="hidden" name="waId" value={waId} />
      <input type="hidden" name="name" value={name} />
      <div className="flex flex-wrap gap-1.5" aria-label="Quick messages">
        {QUICK.map((q) => (
          <Button key={q} type="button" size="sm" variant="outline" disabled={pending} onClick={() => quick(q)} className="h-7 rounded-full px-3 text-xs font-normal">
            {q}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <label htmlFor="sim-text" className="sr-only">Message</label>
        <Input ref={text} id="sim-text" name="text" autoComplete="off" placeholder="Type as the customer" className="bg-background" />
        <Button type="submit" disabled={pending} size="icon" aria-label="Send">
          <SendHorizontalIcon />
        </Button>
      </div>
      {!state.ok && <p role="alert" className="text-xs text-destructive">{state.message}</p>}
    </form>
  );
}
