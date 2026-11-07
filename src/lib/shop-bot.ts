import "server-only";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import type { DB } from "@/db";
import { schema } from "@/db";
import type { Contact, DeliveryZone, Product, Setting, ShopFlow } from "@/db/schema";
import { looksLikeMpesaConfirmation, parseMpesaText } from "./mpesa/parse";

const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
const MENU_WORDS = ["menu", "hi", "hello", "hey", "habari", "sasa", "mambo", "niaje", "start", "0", "back"];
const HANDOFF_WORDS = ["agent", "help", "human", "person", "msaada", "nisaidie", "saidia"];
const CANCEL_WORDS = ["cancel", "stop", "acha"];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function hasWord(text: string, word: string) {
  const w = word.trim().toLowerCase();
  if (!w) return false;
  return new RegExp(`(^|\\s)${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(text);
}
function asNumber(text: string) {
  const m = text.trim().match(/^\d{1,3}$/);
  return m ? Number(m[0]) : null;
}

export function shopMenu(s: Setting, understood = true) {
  return `${understood ? `Karibu *${s.businessName}*! 👋` : "Sorry, I didn't catch that."}${s.greeting ? `\n${s.greeting}` : ""}

Reply with a number:
*1* · See products and prices
*2* · Delivery areas and fees
*3* · Talk to a person

Already paid? Paste your M-Pesa message here.`;
}

function productList(products: Product[]) {
  if (!products.length) return "We're updating our catalogue. Reply *3* to talk to a person.";
  const lines = products.map(
    (p, i) => `*${i + 1}.* ${p.name} · ${kes(p.priceKes)}${p.inStock ? "" : " _(out of stock)_"}`,
  );
  return `*Our products*\n${lines.join("\n")}\n\nReply with a product number to order, or *MENU* to go back.`;
}

function zoneList(zones: DeliveryZone[]) {
  return zones.map((z, i) => `*${i + 1}.* ${z.name} · ${z.feeKes ? kes(z.feeKes) : "Free"}`).join("\n");
}

function productDetail(p: Product) {
  return `*${p.name}* · ${kes(p.priceKes)}${p.description ? `\n${p.description}` : ""}

How many would you like? Reply with a number, e.g. *1*.`;
}

type ShopResult = { reply: string; flow: ShopFlow | null };

/** The shop conversation. Returns the reply and the customer's next step. */
export async function shopReply(db: DB, settings: Setting, contact: Contact, text: string): Promise<ShopResult> {
  const t = normalize(text);
  const flow = contact.flow ?? null;

  const products = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.active, true))
    .orderBy(asc(schema.products.sortOrder), asc(schema.products.id));
  const zones = await db
    .select()
    .from(schema.deliveryZones)
    .where(eq(schema.deliveryZones.active, true))
    .orderBy(asc(schema.deliveryZones.sortOrder), asc(schema.deliveryZones.id));

  // A pasted M-Pesa confirmation works from anywhere in the conversation.
  if (looksLikeMpesaConfirmation(text)) return claimPayment(db, contact, text, flow);

  if (CANCEL_WORDS.some((w) => hasWord(t, w))) {
    return { reply: `No problem, nothing was ordered.\n\n${shopMenu(settings)}`, flow: null };
  }
  if (HANDOFF_WORDS.some((w) => hasWord(t, w)) || (t === "3" && (!flow || flow.step === "browsing"))) {
    return { reply: "Sure! A person will reply to you here shortly. 🙏", flow: null };
  }
  if (MENU_WORDS.some((w) => hasWord(t, w)) && !(flow && flow.step !== "browsing" && asNumber(t) !== null)) {
    return { reply: shopMenu(settings), flow: null };
  }

  const findProduct = (id: number) => products.find((p) => p.id === id);

  // ---- mid-order steps ----
  if (flow?.step === "qty") {
    const p = findProduct(flow.productId);
    const qty = asNumber(t);
    if (!p) return { reply: productList(products), flow: { step: "browsing" } };
    if (!qty || qty < 1 || qty > 50) return { reply: `Please reply with how many *${p.name}* you'd like, e.g. *1*.`, flow };
    if (!zones.length) {
      return { reply: "Where should we deliver? Send your area and a landmark.", flow: { step: "address", productId: p.id, qty, zoneId: 0 } };
    }
    return {
      reply: `${qty} × *${p.name}* = ${kes(p.priceKes * qty)}\n\nWhere should we deliver?\n${zoneList(zones)}\n\nReply with the number.`,
      flow: { step: "zone", productId: p.id, qty },
    };
  }

  if (flow?.step === "zone") {
    const n = asNumber(t);
    const zone = n ? zones[n - 1] : undefined;
    if (!zone) return { reply: `Please reply with a delivery area number:\n${zoneList(zones)}`, flow };
    return {
      reply: `${zone.name} it is.${zone.feeKes ? ` Delivery is ${kes(zone.feeKes)}.` : ""}\n\nPlease send your exact location (estate, building, landmark) and the best phone number for the rider.`,
      flow: { step: "address", productId: flow.productId, qty: flow.qty, zoneId: zone.id },
    };
  }

  if (flow?.step === "address") {
    const p = findProduct(flow.productId);
    if (!p) return { reply: productList(products), flow: { step: "browsing" } };
    if (text.trim().length < 3) return { reply: "Please send your delivery location, e.g. *Rongai, Tuskys stage, Blue gate*.", flow };
    const zone = zones.find((z) => z.id === flow.zoneId);
    const order = await createOrder(db, contact, p, flow.qty, zone, text.trim());
    return {
      reply: `✅ *Order ${order.code}*
${flow.qty} × ${p.name} · ${kes(p.priceKes * flow.qty)}${zone ? `\nDelivery (${zone.name}) · ${zone.feeKes ? kes(zone.feeKes) : "Free"}` : ""}
*Total: ${kes(order.totalKes)}*

${settings.paymentInstructions ? `To pay: ${settings.paymentInstructions}\nIf asked for an account number, use *${order.code}*.` : "We'll send you payment details shortly."}

Then paste your M-Pesa confirmation message here and we'll confirm your order.`,
      flow: { step: "awaiting_payment", orderId: order.id },
    };
  }

  // ---- menu / browsing ----
  const n = asNumber(t);
  if (flow?.step === "browsing" && n) {
    const p = products[n - 1];
    if (!p) return { reply: productList(products), flow };
    if (!p.inStock) return { reply: `Sorry, *${p.name}* is out of stock right now. Pick another number.`, flow };
    return { reply: productDetail(p), flow: { step: "qty", productId: p.id } };
  }
  if (t === "1") return { reply: productList(products), flow: { step: "browsing" } };
  if (t === "2") {
    return {
      reply: zones.length
        ? `*Delivery areas*\n${zoneList(zones)}\n\nReply *1* to see products.`
        : "We deliver around town. Reply *3* and a person will confirm the fee for your area.",
      flow: null,
    };
  }

  // Free text: try to match a product by name or keyword ("bone straight", "frontal").
  const match = products.find(
    (p) => hasWord(t, normalize(p.name)) || p.keywords.split(",").some((k) => hasWord(t, normalize(k))),
  );
  if (match) {
    if (!match.inStock) return { reply: `Sorry, *${match.name}* is out of stock right now.\n\n${productList(products)}`, flow: { step: "browsing" } };
    return { reply: productDetail(match), flow: { step: "qty", productId: match.id } };
  }

  if (flow?.step === "awaiting_payment") {
    return { reply: "Once you've paid, paste the M-Pesa confirmation message here. Reply *MENU* to start over.", flow };
  }
  return { reply: shopMenu(settings, false), flow: null };
}

async function createOrder(db: DB, contact: Contact, p: Product, qty: number, zone: DeliveryZone | undefined, address: string) {
  const subtotal = p.priceKes * qty;
  const fee = zone?.feeKes ?? 0;
  const [draft] = await db
    .insert(schema.orders)
    .values({
      code: `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      contactId: contact.id,
      customerName: contact.name,
      phone: contact.waId,
      zoneName: zone?.name ?? null,
      address,
      subtotalKes: subtotal,
      deliveryFeeKes: fee,
      totalKes: subtotal + fee,
      isDemo: contact.isDemo,
    })
    .returning();
  const [order] = await db
    .update(schema.orders)
    .set({ code: `ZL-${1000 + draft.id}` })
    .where(eq(schema.orders.id, draft.id))
    .returning();
  await db.insert(schema.orderItems).values({ orderId: order.id, productId: p.id, name: p.name, priceKes: p.priceKes, qty });
  return order;
}

/** Customer pasted an M-Pesa message: attach it to their open order as a claim. */
async function claimPayment(db: DB, contact: Contact, text: string, flow: ShopFlow | null): Promise<ShopResult> {
  const [payment] = parseMpesaText(text);
  if (!payment) return { reply: "I couldn't read that M-Pesa message. Please paste the full confirmation SMS.", flow };

  // Same code already used on another order? Flag it.
  const reused = await db
    .select({ code: schema.orders.code })
    .from(schema.orders)
    .where(eq(schema.orders.mpesaCode, payment.code))
    .limit(1);

  const target =
    (flow?.step === "awaiting_payment"
      ? (await db.select().from(schema.orders).where(eq(schema.orders.id, flow.orderId)).limit(1))[0]
      : undefined) ??
    (
      await db
        .select()
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.contactId, contact.id),
            inArray(schema.orders.paymentStatus, ["unpaid", "mismatch"]),
            ne(schema.orders.status, "cancelled"),
          ),
        )
        .orderBy(desc(schema.orders.createdAt))
        .limit(1)
    )[0];

  if (!target) {
    return { reply: `Thanks! We got M-Pesa ${payment.code} for ${kes(payment.amountKes)}, but I can't find an open order for you. A person will check and reply shortly.`, flow: null };
  }
  if (reused.length && reused[0].code !== target.code) {
    await db.update(schema.orders).set({ paymentStatus: "mismatch", notes: `Code ${payment.code} was already used on ${reused[0].code}.`, updatedAt: new Date() }).where(eq(schema.orders.id, target.id));
    return { reply: `That M-Pesa code was already used for another order. A person will check and reply shortly.`, flow: null };
  }

  const enough = payment.amountKes >= target.totalKes;
  await db
    .update(schema.orders)
    .set({
      mpesaCode: payment.code,
      mpesaAmountKes: payment.amountKes,
      paymentStatus: enough ? "claimed" : "mismatch",
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, target.id));

  return enough
    ? { reply: `🙏 Asante! We've received your M-Pesa message (${payment.code}) for *${target.code}*. We'll confirm and arrange delivery shortly.`, flow: null }
    : {
        reply: `We got ${kes(payment.amountKes)} (${payment.code}) for *${target.code}*, but the total is ${kes(target.totalKes)}. Please send the balance of ${kes(target.totalKes - payment.amountKes)}, or reply *3* to talk to a person.`,
        flow: { step: "awaiting_payment", orderId: target.id },
      };
}
