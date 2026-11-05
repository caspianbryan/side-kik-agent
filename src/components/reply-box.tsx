"use client";

import { useActionState, useRef } from "react";
import { SendHorizontalIcon } from "lucide-react";
import { toast } from "sonner";
import { sendReply, type ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReplyBox({ contactId, live }: { contactId: number; live: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const result = await sendReply(prev, fd);
    if (result.ok) {
      form.current?.reset();
      toast.success(live ? "Reply sent" : "Reply saved (demo mode)");
    }
    return result;
  }, { ok: true });

  return (
    <form ref={form} action={action} className="border-t p-3">
      <input type="hidden" name="contactId" value={contactId} />
      <label htmlFor="reply" className="sr-only">Reply</label>
      <div className="flex items-end gap-2">
        <Textarea
          id="reply"
          name="body"
          rows={1}
          placeholder="Write a reply"
          className="max-h-40 min-h-10 resize-none bg-background"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) form.current?.requestSubmit();
          }}
        />
        <Button type="submit" disabled={pending} className="h-10">
          <SendHorizontalIcon />
          {pending ? "Sending…" : "Send reply"}
        </Button>
      </div>
      <p className={`mt-2 text-xs ${state.ok ? "text-muted-foreground" : "text-destructive"}`} role="status">
        {!state.ok
          ? state.message
          : live
            ? "Ctrl+Enter sends. Replies reach people who messaged in the last 24 hours."
            : "Demo mode: replies are saved here, not sent to WhatsApp."}
      </p>
    </form>
  );
}
