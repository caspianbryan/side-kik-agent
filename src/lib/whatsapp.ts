import "server-only";
import crypto from "node:crypto";

export type DeliveryStatus = "sent" | "logged" | "failed";

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v27.0";

/** True when Meta credentials are set; otherwise the hub runs in demo mode. */
export function isLive() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

/**
 * Sends a plain-text WhatsApp message. Free-form text only reaches people who messaged
 * you in the last 24 hours (Meta's customer-service window) — exactly the bot's case.
 * In demo mode (no token) nothing is sent and the message is just logged.
 */
export async function sendText(to: string, body: string): Promise<DeliveryStatus> {
  if (!isLive()) return "logged";
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body, preview_url: false },
        }),
      },
    );
    if (!res.ok) {
      console.error("WhatsApp send failed", res.status, await res.text());
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("WhatsApp send error", err);
    return "failed";
  }
}

/** Checks Meta's X-Hub-Signature-256 header. Skipped (returns true) if no app secret is set. */
export function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = header.slice("sha256=".length);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(given, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
