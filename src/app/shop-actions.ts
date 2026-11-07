"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { seedDemoShop } from "@/db/seed";
import { BOT_MODES, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { matchPayments, type MatchResult } from "@/lib/mpesa/match";
import { parseMpesaText } from "@/lib/mpesa/parse";
import { getSettings } from "@/lib/settings";

export type ActionState = { ok: boolean; message?: string };

function refresh() {
  revalidatePath("/", "layout");
}

const kes = z.coerce.number().int().min(0).max(10_000_000);
const on = z.literal("on").optional();

/* ---------- Settings ---------- */

const settingsSchema = z.object({
  mode: z.enum(BOT_MODES),
  businessName: z.string().trim().min(1, "Add the business name").max(80),
  greeting: z.string().trim().max(200).default(""),
  paymentInstructions: z.string().trim().max(300).default(""),
});

export async function saveSettings(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = settingsSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const db = await getDb();
  await getSettings(db);
  await db.update(schema.settings).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schema.settings.id, 1));
  refresh();
  return { ok: true, message: "Settings saved." };
}

export async function loadDemoShop() {
  const db = await getDb();
  await seedDemoShop(db);
  refresh();
}

/* ---------- Products ---------- */

const productSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1, "Add a product name").max(120),
  description: z.string().trim().max(500).default(""),
  priceKes: kes,
  keywords: z.string().trim().max(300).default(""),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  inStock: on,
  active: on,
});

export async function saveProduct(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = productSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, inStock, active, ...rest } = parsed.data;
  const values = { ...rest, inStock: inStock === "on", active: active === "on", updatedAt: new Date() };
  const db = await getDb();
  if (id) await db.update(schema.products).set(values).where(eq(schema.products.id, id));
  else await db.insert(schema.products).values(values);
  refresh();
  return { ok: true, message: id ? "Product saved." : "Product added." };
}

export async function setProductStock(id: number, inStock: boolean) {
  const db = await getDb();
  await db.update(schema.products).set({ inStock, updatedAt: new Date() }).where(eq(schema.products.id, id));
  refresh();
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  await db.delete(schema.products).where(eq(schema.products.id, id));
  refresh();
}

/* ---------- Delivery zones ---------- */

const zoneSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(1, "Add the area name").max(80),
  feeKes: kes,
});

export async function saveZone(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = zoneSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, ...values } = parsed.data;
  const db = await getDb();
  if (id) await db.update(schema.deliveryZones).set(values).where(eq(schema.deliveryZones.id, id));
  else await db.insert(schema.deliveryZones).values(values);
  refresh();
  return { ok: true, message: id ? "Area saved." : "Area added." };
}

export async function deleteZone(id: number) {
  const db = await getDb();
  await db.delete(schema.deliveryZones).where(eq(schema.deliveryZones.id, id));
  refresh();
}

/* ---------- Orders ---------- */

const orderUpdateSchema = z.object({
  id: z.coerce.number().int(),
  status: z.enum(ORDER_STATUSES),
  paymentStatus: z.enum(PAYMENT_STATUSES),
  mpesaCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^$|^[A-Z0-9]{10}$/, "M-Pesa codes are 10 letters and numbers")
    .default(""),
  notes: z.string().max(2000).default(""),
});

export async function saveOrder(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = orderUpdateSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, mpesaCode, paymentStatus, ...rest } = parsed.data;
  const db = await getDb();
  await db
    .update(schema.orders)
    .set({
      ...rest,
      paymentStatus,
      mpesaCode: mpesaCode || null,
      verifiedAt: paymentStatus === "verified" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, id));
  refresh();
  return { ok: true, message: "Order saved." };
}

export async function setOrderStatus(id: number, status: (typeof ORDER_STATUSES)[number]) {
  const db = await getDb();
  await db.update(schema.orders).set({ status, updatedAt: new Date() }).where(eq(schema.orders.id, id));
  refresh();
}

/* ---------- Reconciliation ---------- */

export type ReconcileState = { ok: boolean; message?: string; results?: (MatchResult & { applied: boolean })[] };

/**
 * Paste M-Pesa messages or statement rows the owner actually received.
 * Matches each to an order; verified matches are saved.
 */
export async function reconcile(_: ReconcileState, form: FormData): Promise<ReconcileState> {
  const text = String(form.get("text") ?? "");
  const payments = parseMpesaText(text);
  if (!payments.length) {
    return { ok: false, message: "No M-Pesa transactions found. Paste the full messages, including the transaction code." };
  }

  const db = await getDb();
  const open = await db
    .select({
      id: schema.orders.id,
      code: schema.orders.code,
      totalKes: schema.orders.totalKes,
      paymentStatus: schema.orders.paymentStatus,
      mpesaCode: schema.orders.mpesaCode,
    })
    .from(schema.orders)
    .where(ne(schema.orders.status, "cancelled"));

  const results = matchPayments(payments, open);
  const applied: (MatchResult & { applied: boolean })[] = [];

  for (const r of results) {
    if (r.kind === "verified") {
      // Never verify two orders with one M-Pesa code.
      const clash = await db
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(and(eq(schema.orders.mpesaCode, r.payment.code), ne(schema.orders.id, r.orderId)))
        .limit(1);
      if (clash.length) {
        applied.push({ ...r, applied: false });
        continue;
      }
      await db
        .update(schema.orders)
        .set({
          paymentStatus: "verified",
          mpesaCode: r.payment.code,
          mpesaAmountKes: r.payment.amountKes,
          verifiedAt: new Date(),
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, r.orderId));
      applied.push({ ...r, applied: true });
    } else if (r.kind === "short") {
      await db
        .update(schema.orders)
        .set({ paymentStatus: "mismatch", mpesaCode: r.payment.code, mpesaAmountKes: r.payment.amountKes, updatedAt: new Date() })
        .where(eq(schema.orders.id, r.orderId));
      applied.push({ ...r, applied: true });
    } else {
      applied.push({ ...r, applied: false });
    }
  }

  refresh();
  const verified = applied.filter((r) => r.kind === "verified" && r.applied).length;
  return { ok: true, message: `${payments.length} payment${payments.length === 1 ? "" : "s"} read, ${verified} verified.`, results: applied };
}

/* ---------- Demo cleanup (shop) ---------- */

export async function clearDemoShop() {
  const db = await getDb();
  await db.delete(schema.orders).where(eq(schema.orders.isDemo, true));
  const demoProducts = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.isDemo, true));
  if (demoProducts.length) await db.delete(schema.products).where(inArray(schema.products.id, demoProducts.map((p) => p.id)));
  refresh();
}
