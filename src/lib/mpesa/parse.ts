/**
 * M-Pesa message parsing. Self-contained (no app imports) so it can move to a shared
 * payments service (e.g. Brycore) later.
 *
 * Handles what people actually paste:
 *  - customer confirmations: "QK51ABCD12 Confirmed. Ksh1,500.00 paid to MAMA WIGS. on 7/11/26 at 9:41 PM…"
 *  - paybill:               "…Ksh1,500.00 sent to EQUITY for account ZL-1042 on…"
 *  - owner/till receipts:   "QK51ABCD12 Confirmed. You have received Ksh1,500.00 from JOHN DOE 0712***678…"
 *  - statement rows:        "QK51ABCD12  2026-11-07 21:41:00  Customer Payment …  1,500.00"
 */

export type ParsedPayment = {
  /** M-Pesa transaction code, upper case, 10 characters. */
  code: string;
  /** Whole shillings (cents dropped). */
  amountKes: number;
  /** Account / reference typed by the payer, if any (paybill "for account X"). */
  account: string | null;
  /** The text this payment was read from. */
  raw: string;
};

// Codes are 10 upper-case letters/digits, start with a letter and contain at least one digit.
const CODE_RE = /\b([A-Z](?=[A-Z0-9]{9}\b)(?=[A-Z0-9]*\d)[A-Z0-9]{9})\b/g;
const KSH_RE = /K(?:sh|es)\.?\s?([\d,]+(?:\.\d{1,2})?)/i;
const PLAIN_AMOUNT_RE = /(?:^|\s)([\d]{1,3}(?:,\d{3})*(?:\.\d{2})|\d+\.\d{2})(?=\s|$)/;
const ACCOUNT_RE = /for account\s+([A-Za-z0-9-]+)/i;

function toKes(s: string) {
  return Math.floor(Number(s.replace(/,/g, "")));
}

/** Pull every payment out of a block of pasted text (one or many messages / statement rows). */
export function parseMpesaText(text: string): ParsedPayment[] {
  const found: { code: string; index: number }[] = [];
  for (const m of text.matchAll(CODE_RE)) found.push({ code: m[1], index: m.index ?? 0 });

  const out: ParsedPayment[] = [];
  const seen = new Set<string>();
  found.forEach((f, i) => {
    const segment = text.slice(f.index, i + 1 < found.length ? found[i + 1].index : undefined);
    const ksh = segment.match(KSH_RE);
    const plain = ksh ? null : segment.slice(f.code.length).match(PLAIN_AMOUNT_RE);
    const amount = ksh ? toKes(ksh[1]) : plain ? toKes(plain[1]) : NaN;
    if (!Number.isFinite(amount) || amount <= 0 || seen.has(f.code)) return;
    seen.add(f.code);
    out.push({
      code: f.code,
      amountKes: amount,
      account: segment.match(ACCOUNT_RE)?.[1]?.toUpperCase() ?? null,
      raw: segment.trim().slice(0, 300),
    });
  });
  return out;
}

/** True if a chat message looks like an M-Pesa confirmation (so the bot treats it as a payment claim). */
export function looksLikeMpesaConfirmation(text: string) {
  return /confirmed/i.test(text) && KSH_RE.test(text) && new RegExp(CODE_RE.source).test(text);
}
