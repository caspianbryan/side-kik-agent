import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Service } from "@/db/schema";
import { getSettings } from "./settings";
import { shopReply } from "./shop-bot";
import { sendText, type DeliveryStatus } from "./whatsapp";

const HANDOFF_WORDS = ["agent", "help", "human", "msaada", "nisaidie", "saidia"];
const MENU_WORDS = ["menu", "hi", "hello", "hey", "habari", "sasa", "mambo", "niaje", "start", "0"];

type Intent =
  | { kind: "service"; service: Service }
  | { kind: "handoff"; service?: Service }
  | { kind: "menu"; understood: boolean };

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function hasWord(text: string, word: string) {
  const w = word.trim().toLowerCase();
  if (!w) return false;
  return new RegExp(`(^|\\s)${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text);
}

export function detectIntent(raw: string, services: Service[]): Intent {
  const text = normalize(raw);
  if (!text) return { kind: "menu", understood: false };

  const service =
    services.find((s) => s.menuKey === text) ??
    services.find((s) => s.keywords.split(",").some((k) => hasWord(text, k)));

  // "nisaidie kra pin" = hand off AND remember the service.
  if (HANDOFF_WORDS.some((w) => hasWord(text, w))) return { kind: "handoff", service };
  if (service) return { kind: "service", service };

  return { kind: "menu", understood: MENU_WORDS.some((w) => hasWord(text, w)) };
}

export function menuText(services: Service[], understood = true) {
  const lines = services.map((s) => `*${s.menuKey}* · ${s.name}`).join("\n");
  const opener = understood
    ? "👋 Karibu! I help you apply for government services, step by step."
    : "Sorry, I didn't catch that. Here's what I can help with:";
  return `${opener}

Reply with a number:
${lines}

Reply *AGENT* any time and a person will do it for you.
_Independent guide, not a government office. We never ask for your passwords._`;
}

export function serviceReply(service: Service) {
  return `${service.checklist}

———
Want us to do it for you? Reply *AGENT* (KES ${service.priceKes.toLocaleString("en-KE")} + any official fee).
Reply *MENU* for other services.`;
}

export type IncomingResult = { reply: string | null; duplicate: boolean; status?: DeliveryStatus };

/**
 * The whole bot: log the incoming message, pick a reply, send it, log the reply.
 * Used by the Meta webhook and by the simulator page.
 */
export async function handleIncoming(input: {
  waId: string;
  name?: string | null;
  text: string;
  waMessageId?: string | null;
  isDemo?: boolean;
}): Promise<IncomingResult> {
  const db = await getDb();

  if (input.waMessageId) {
    const seen = await db
      .select({ id: schema.messages.id })
      .from(schema.messages)
      .where(eq(schema.messages.waMessageId, input.waMessageId))
      .limit(1);
    if (seen.length) return { reply: null, duplicate: true };
  }

  const [contact] = await db
    .insert(schema.contacts)
    .values({ waId: input.waId, name: input.name ?? null, isDemo: input.isDemo ?? false })
    .onConflictDoUpdate({
      target: schema.contacts.waId,
      set: {
        lastSeenAt: new Date(),
        name: sql`coalesce(${input.name ?? null}, ${schema.contacts.name})`,
      },
    })
    .returning();

  const settings = await getSettings(db);
  let reply: string;
  let serviceSlug: string | null = null;

  if (settings.mode === "shop") {
    const result = await shopReply(db, settings, contact, input.text);
    reply = result.reply;
    await db.update(schema.contacts).set({ flow: result.flow }).where(eq(schema.contacts.id, contact.id));
  } else {
    ({ reply, serviceSlug } = await servicesReply(contact, input.text));
  }

  await db.insert(schema.messages).values({
    contactId: contact.id,
    direction: "in",
    author: "contact",
    body: input.text,
    serviceSlug,
    waMessageId: input.waMessageId ?? null,
  });

  const status = contact.isDemo ? "logged" : await sendText(contact.waId, reply);
  await db.insert(schema.messages).values({
    contactId: contact.id,
    direction: "out",
    author: "bot",
    body: reply,
    serviceSlug,
    deliveryStatus: status,
  });

  return { reply, duplicate: false, status };
}

/** The government-services helper: menu, checklists, AGENT handoff. */
async function servicesReply(contact: typeof schema.contacts.$inferSelect, text: string) {
  const db = await getDb();
  const services = await db
    .select()
    .from(schema.services)
    .where(eq(schema.services.active, true))
    .orderBy(asc(schema.services.menuKey));

  const intent = detectIntent(text, services);
  let serviceSlug: string | null = null;

  if (intent.kind === "service") {
    serviceSlug = intent.service.slug;
    await db.update(schema.contacts).set({ lastServiceSlug: serviceSlug }).where(eq(schema.contacts.id, contact.id));
    return { reply: serviceReply(intent.service), serviceSlug };
  }

  if (intent.kind === "handoff") {
    const service = intent.service ?? services.find((s) => s.slug === contact.lastServiceSlug);
    if (!service) {
      return {
        reply: `Sure! Which service do you need help with?\n\n${services
          .map((s) => `*${s.menuKey}* · ${s.name}`)
          .join("\n")}\n\nReply with the number, then *AGENT*.`,
        serviceSlug,
      };
    }
    serviceSlug = service.slug;
    if (intent.service) {
      await db.update(schema.contacts).set({ lastServiceSlug: serviceSlug }).where(eq(schema.contacts.id, contact.id));
    }
    await ensureLead(contact.id, contact.name, contact.waId, service, contact.isDemo);
    return {
      reply: `Asante! 🙌 A person will message you here shortly to help with *${service.name}*.

Our fee: *KES ${service.priceKes.toLocaleString("en-KE")}* + any official fee. You pay only after we confirm what's needed.`,
      serviceSlug,
    };
  }

  return { reply: menuText(services, intent.understood), serviceSlug };
}

/** One open lead per contact + service, so repeated "AGENT" doesn't create duplicates. */
async function ensureLead(
  contactId: number,
  name: string | null,
  waId: string,
  service: Service,
  isDemo: boolean,
) {
  const db = await getDb();
  const open = await db
    .select({ id: schema.leads.id })
    .from(schema.leads)
    .where(
      and(
        eq(schema.leads.contactId, contactId),
        eq(schema.leads.serviceSlug, service.slug),
        inArray(schema.leads.stage, ["new", "contacted"]),
      ),
    )
    .limit(1);
  if (open.length) return;
  await db.insert(schema.leads).values({
    kind: "application",
    name: name || `+${waId}`,
    phone: waId,
    serviceSlug: service.slug,
    amountKes: service.priceKes,
    contactId,
    isDemo,
  });
}

/** A reply you type in the inbox. */
export async function sendHumanReply(contactId: number, body: string) {
  const db = await getDb();
  const [contact] = await db
    .select()
    .from(schema.contacts)
    .where(eq(schema.contacts.id, contactId))
    .limit(1);
  if (!contact) throw new Error("Contact not found");
  const status = contact.isDemo ? "logged" : await sendText(contact.waId, body);
  await db.insert(schema.messages).values({
    contactId,
    direction: "out",
    author: "human",
    body,
    deliveryStatus: status,
  });
  return status;
}
