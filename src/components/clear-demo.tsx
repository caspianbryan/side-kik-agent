"use client";

import { useState, useTransition } from "react";
import { clearDemoData } from "@/app/actions";

export function ClearDemoButton() {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (!confirming)
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-md border border-current px-3 py-1.5 text-xs font-medium"
      >
        Clear demo data
      </button>
    );

  return (
    <span className="flex items-center gap-2 text-xs">
      <span>Delete all demo chats and leads?</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => clearDemoData())}
        className="rounded-md bg-danger px-3 py-1.5 font-medium text-white disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete demo data"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="px-2 py-1.5 underline">
        Keep it
      </button>
    </span>
  );
}
