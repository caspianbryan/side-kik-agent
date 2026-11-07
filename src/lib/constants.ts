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
  contactId?: number | null;
  updatedAt?: string;
};

export const STAGE_LABEL: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  paid: "Paid",
  done: "Done",
  lost: "Lost",
};

/* ---------- Shop ---------- */

export const BOT_MODES = ["services", "shop"] as const;
export type BotMode = (typeof BOT_MODES)[number];

/** Fulfilment status of an order. */
export const ORDER_STATUSES = ["new", "confirmed", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * Payment status, separate from fulfilment:
 * unpaid → claimed (customer sent an M-Pesa message) → verified (matched to the owner's own M-Pesa record).
 * "mismatch" = a claim that didn't match (wrong amount, unknown or reused code).
 */
export const PAYMENT_STATUSES = ["unpaid", "claimed", "verified", "mismatch"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  claimed: "Claimed paid",
  verified: "Verified",
  mismatch: "Check payment",
};
