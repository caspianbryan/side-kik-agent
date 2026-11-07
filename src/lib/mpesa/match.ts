/**
 * Reconciliation: match payments the owner really received against orders.
 * Pure function, no database: callers load orders, apply the returned decisions.
 */
import type { ParsedPayment } from "./parse";

export type ReconcilableOrder = {
  id: number;
  code: string;
  totalKes: number;
  paymentStatus: "unpaid" | "claimed" | "verified" | "mismatch";
  mpesaCode: string | null;
};

export type MatchResult =
  | { kind: "verified"; payment: ParsedPayment; orderId: number; orderCode: string; how: "account" | "claimed code" | "amount" }
  | { kind: "short"; payment: ParsedPayment; orderId: number; orderCode: string; dueKes: number }
  | { kind: "already"; payment: ParsedPayment; orderCode: string }
  | { kind: "ambiguous"; payment: ParsedPayment; candidates: string[] }
  | { kind: "unmatched"; payment: ParsedPayment };

export function matchPayments(payments: ParsedPayment[], orders: ReconcilableOrder[]): MatchResult[] {
  const taken = new Set<number>(); // an order can only absorb one payment per run
  const results: MatchResult[] = [];

  for (const p of payments) {
    const decide = (o: ReconcilableOrder, how: "account" | "claimed code" | "amount"): MatchResult => {
      taken.add(o.id);
      if (o.paymentStatus === "verified") return { kind: "already", payment: p, orderCode: o.code };
      if (p.amountKes < o.totalKes) return { kind: "short", payment: p, orderId: o.id, orderCode: o.code, dueKes: o.totalKes };
      return { kind: "verified", payment: p, orderId: o.id, orderCode: o.code, how };
    };

    // 1. Paybill account reference = order code (strongest signal).
    const byAccount = p.account ? orders.find((o) => o.code.toUpperCase() === p.account) : undefined;
    if (byAccount) { results.push(decide(byAccount, "account")); continue; }

    // 2. The customer already sent us this M-Pesa code in the chat.
    const byClaim = orders.find((o) => o.mpesaCode?.toUpperCase() === p.code);
    if (byClaim) { results.push(decide(byClaim, "claimed code")); continue; }

    // 3. Exactly one open order for this exact amount.
    const open = orders.filter((o) => !taken.has(o.id) && o.paymentStatus !== "verified" && o.totalKes === p.amountKes);
    if (open.length === 1) { results.push(decide(open[0], "amount")); continue; }
    if (open.length > 1) { results.push({ kind: "ambiguous", payment: p, candidates: open.map((o) => o.code) }); continue; }

    results.push({ kind: "unmatched", payment: p });
  }
  return results;
}
