"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { clearDemoData } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function ClearDemoButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (!confirming)
    return (
      <Button size="sm" variant="outline" onClick={() => setConfirming(true)} className="border-warning-fg/40 bg-transparent text-warning-fg hover:bg-warning-fg/10 hover:text-warning-fg">
        Clear demo data
      </Button>
    );

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span>Delete all demo chats and leads?</span>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await clearDemoData();
            toast.success("Demo data deleted");
          })
        }
      >
        {pending ? "Deleting…" : "Delete demo data"}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        Keep it
      </Button>
    </div>
  );
}
