"use client";

import { useActionState, useEffect, useRef } from "react";
import { sendReply, type ActionState } from "@/app/actions";
import { buttonClass, inputClass } from "@/components/ui";

export function ReplyBox({ contactId, live }: { contactId: number; live: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendReply, { ok: true });
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && !pending) form.current?.reset();
  }, [state, pending]);

  return (
    <form ref={form} action={action} className="border-t border-line p-3">
      <input type="hidden" name="contactId" value={contactId} />
      <label htmlFor="reply" className="sr-only">Reply</label>
      <div className="flex gap-2">
        <textarea
          id="reply"
          name="body"
          rows={2}
          placeholder="Type a reply…"
          className={`${inputClass} resize-none`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) form.current?.requestSubmit();
          }}
        />
        <button type="submit" disabled={pending} className={`${buttonClass} self-end`}>
          {pending ? "Sending…" : "Send reply"}
        </button>
      </div>
      <p className={`mt-1.5 text-xs ${state.ok ? "text-ink-3" : "text-danger"}`} role="status">
        {!state.ok
          ? state.message
          : live
            ? "Ctrl+Enter to send. Free-form replies only reach people who messaged in the last 24 h."
            : "Demo mode: replies are saved here, not sent to WhatsApp."}
      </p>
    </form>
  );
}
