"use client";

import { useState, useTransition } from "react";
import { ChevronRightIcon } from "lucide-react";
import { moveLead } from "@/app/actions";
import { LeadEditor } from "@/components/lead-editor";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LEAD_STAGES, STAGE_LABEL, type LeadRow, type LeadStage } from "@/lib/constants";
import { initials, kes, phone, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const STAGE_DOT: Record<LeadStage, string> = {
  new: "bg-primary",
  contacted: "bg-sky-400",
  paid: "bg-success",
  done: "bg-success/50",
  lost: "bg-muted-foreground/50",
};

function StageSelect({ lead }: { lead: LeadRow }) {
  const [pending, start] = useTransition();
  return (
    <Select value={lead.stage} disabled={pending} onValueChange={(v) => start(() => moveLead(lead.id, v as LeadStage))}>
      <SelectTrigger
        size="sm"
        aria-label={`Stage for ${lead.name}`}
        className={cn("w-[8.5rem] bg-background", pending && "opacity-60")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STAGES.map((s) => (
          <SelectItem key={s} value={s}>
            <span className={cn("size-1.5 rounded-full", STAGE_DOT[s])} aria-hidden />
            {STAGE_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function LeadsList({ leads, serviceNames }: { leads: LeadRow[]; serviceNames: Record<string, string> }) {
  const [openId, setOpenId] = useState<number | null>(null);
  const open = leads.find((l) => l.id === openId) ?? null;
  const what = (l: LeadRow) => (l.kind === "sme" ? l.business : serviceNames[l.serviceSlug ?? ""] ?? l.serviceSlug) || "—";

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        {/* Column labels, desktop only */}
        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_9rem_9rem_6rem_1.5rem] gap-4 border-b px-5 py-3 text-xs text-muted-foreground lg:grid">
          <span>Lead</span>
          <span>What they need</span>
          <span className="text-right">Value</span>
          <span>Stage</span>
          <span>Updated</span>
          <span className="sr-only">Open</span>
        </div>

        <ul>
          {leads.map((l) => (
            <li key={l.id} className="border-b last:border-b-0">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpenId(l.id)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(l.id);
                  }
                }}
                aria-label={`Edit ${l.name}`}
                className="group grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 px-4 py-4 transition-colors duration-150 outline-none hover:bg-accent/50 focus-visible:bg-accent/60 sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_9rem_9rem_6rem_1.5rem] lg:gap-y-0"
              >
                {/* Lead */}
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>{initials(l.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium">
                      <span className="truncate">{l.name}</span>
                      {l.isDemo && <Badge variant="warning">Demo</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{l.phone ? phone(l.phone) : "No phone"}</p>
                  </div>
                </div>

                {/* Value on mobile sits top-right */}
                <p className="font-display text-right text-[1.0625rem] leading-tight lg:hidden">{kes(l.amountKes)}</p>

                {/* What */}
                <div className="col-span-2 flex min-w-0 items-center gap-2 lg:col-span-1">
                  <Badge variant={l.kind === "sme" ? "default" : "secondary"}>{l.kind === "sme" ? "SME" : "Application"}</Badge>
                  <span className="truncate text-sm text-muted-foreground">{what(l)}</span>
                </div>

                {/* Value, desktop */}
                <div className="hidden text-right lg:block">
                  <p className="font-display text-[1.0625rem] leading-tight">{kes(l.amountKes)}</p>
                  {l.monthlyKes > 0 && <p className="text-xs text-muted-foreground">+ {kes(l.monthlyKes)}/mo</p>}
                </div>

                {/* Stage. Stops clicks here (and in the portaled menu, which bubbles through React) from opening the editor. */}
                <div
                  className="flex items-center justify-between gap-3 lg:block"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <StageSelect lead={l} />
                </div>

                <p className="text-right text-xs text-muted-foreground lg:text-left">{timeAgo(l.updatedAt)}</p>

                <ChevronRightIcon className="hidden size-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 lg:block" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <LeadEditor
        lead={open}
        serviceName={open ? serviceNames[open.serviceSlug ?? ""] : undefined}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </>
  );
}
