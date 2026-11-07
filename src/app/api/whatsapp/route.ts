import type { NextRequest } from "next/server";
import { handleIncoming } from "@/lib/bot";
import { verifySignature } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/** Meta calls this once when you save the webhook URL, to check you own it. */
export function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const ok =
    p.get("hub.mode") === "subscribe" &&
    !!process.env.WHATSAPP_VERIFY_TOKEN &&
    p.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN;
  return ok
    ? new Response(p.get("hub.challenge") ?? "", { status: 200 })
    : new Response("Forbidden", { status: 403 });
}

type WaMessage = {
  from?: string;
  from_user_id?: string;
  id: string;
  type: string;
  text?: { body: string };
  button?: { text: string };
  interactive?: { button_reply?: { title: string }; list_reply?: { title: string } };
};

type WaChange = {
  field?: string;
  value?: {
    contacts?: { wa_id?: string; user_id?: string; profile?: { name?: string } }[];
    messages?: WaMessage[];
  };
};

type WaPayload = {
  entry?: { changes?: WaChange[] }[];
  // The dashboard "Test" button can send a bare change: { field, value }.
  field?: string;
  value?: WaChange["value"];
};

/** Incoming messages (and status updates, which we ignore). */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return new Response("Bad signature", { status: 401 });
  }

  let payload: WaPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const changes: WaChange[] =
    payload.entry?.flatMap((e) => e.changes ?? []) ?? (payload.value ? [{ field: payload.field, value: payload.value }] : []);

  for (const change of changes) {
    {
      const value = change.value;
      for (const msg of value?.messages ?? []) {
        // Phone number when available; usernames (BSUID) may arrive without one.
        const waId = msg.from ?? msg.from_user_id;
        if (!waId) continue;
        const text =
          msg.text?.body ??
          msg.button?.text ??
          msg.interactive?.button_reply?.title ??
          msg.interactive?.list_reply?.title ??
          `[${msg.type}]`;
        const name = value?.contacts?.find((c) => c.wa_id === waId || c.user_id === waId)?.profile?.name;
        try {
          await handleIncoming({ waId, name, text, waMessageId: msg.id });
        } catch (err) {
          // Still answer 200 so Meta doesn't retry forever; the error is in the logs.
          console.error("Failed to handle WhatsApp message", msg.id, err);
        }
      }
    }
  }

  return new Response("OK", { status: 200 });
}
