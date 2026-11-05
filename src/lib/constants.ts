// Shared by the DB schema, server actions and client components (no DB imports here).
export const LEAD_STAGES = ["new", "contacted", "paid", "done", "lost"] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_KINDS = ["application", "sme"] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

export type LeadRow = {
  id: number;
  kind: LeadKind;
  name: string;
  phone: string | null;
  serviceSlug: string | null;
  business: string | null;
  stage: LeadStage;
  amountKes: number;
  monthlyKes: number;
  notes: string;
  isDemo: boolean;
};

export const STAGE_LABEL: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  paid: "Paid",
  done: "Done",
  lost: "Lost",
};
