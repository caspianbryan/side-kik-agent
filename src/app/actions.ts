"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb, schema } from "@/db";
import { LEAD_KINDS, LEAD_STAGES } from "@/db/schema";
import { handleIncoming, sendHumanReply } from "@/lib/bot";

export type ActionState = { ok: boolean; message?: string };

function refresh() {
  revalidatePath("/", "layout");
}

const kes = z.coerce.number().int().min(0).max(10_000_000);

/* ---------- Simulator ---------- */

const simSchema = z.object({
  waId: z.string().regex(/^254\d{9}$/, "Use a Kenyan number like 254712345678"),
  name: z.string().trim().max(60).optional(),
  text: z.string().trim().min(1, "Type a message").max(1000),
});

export async function simulateMessage(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = simSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  await handleIncoming({ ...parsed.data, name: parsed.data.name || null, isDemo: true });
  refresh();
  return { ok: true };
}

/* ---------- Inbox ---------- */

export async function sendReply(_: ActionState, form: FormData): Promise<ActionState> {
  const contactId = Number(form.get("contactId"));
  const body = String(form.get("body") ?? "").trim();
  if (!body) return { ok: false, message: "Type a reply first." };
  const status = await sendHumanReply(contactId, body);
  refresh();
  if (status === "failed")
    return { ok: false, message: "Saved, but WhatsApp didn't accept it. Check the token and the 24-hour window." };
  return { ok: true };
}

/* ---------- Leads ---------- */

const leadSchema = z.object({
  kind: z.enum(LEAD_KINDS),
  name: z.string().trim().min(1, "Add a name").max(80),
  phone: z.string().trim().max(20).optional(),
  serviceSlug: z.string().trim().optional(),
  business: z.string().trim().max(120).optional(),
  amountKes: kes.default(0),
  monthlyKes: kes.default(0),
  notes: z.string().trim().max(2000).optional(),
});

export async function createLead(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = leadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const d = parsed.data;
  const db = await getDb();
  await db.insert(schema.leads).values({
    kind: d.kind,
    name: d.name,
    phone: d.phone || null,
    serviceSlug: d.kind === "application" ? d.serviceSlug || null : null,
    business: d.kind === "sme" ? d.business || null : null,
    amountKes: d.amountKes,
    monthlyKes: d.kind === "sme" ? d.monthlyKes : 0,
    notes: d.notes ?? "",
  });
  refresh();
  return { ok: true, message: "Lead added." };
}

const leadUpdateSchema = z.object({
  id: z.coerce.number().int(),
  stage: z.enum(LEAD_STAGES),
  amountKes: kes,
  monthlyKes: kes.default(0),
  notes: z.string().max(2000).default(""),
});

export async function updateLead(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = leadUpdateSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, ...rest } = parsed.data;
  const db = await getDb();
  await db
    .update(schema.leads)
    .set({ ...rest, updatedAt: new Date() })
    .where(eq(schema.leads.id, id));
  refresh();
  return { ok: true, message: "Saved." };
}

/** Quick stage change from the pipeline card. */
export async function moveLead(id: number, stage: (typeof LEAD_STAGES)[number]) {
  const db = await getDb();
  await db
    .update(schema.leads)
    .set({ stage, updatedAt: new Date() })
    .where(eq(schema.leads.id, id));
  refresh();
}

/* ---------- Checklists ---------- */

const serviceSchema = z.object({
  id: z.coerce.number().int(),
  name: z.string().trim().min(1, "Name can't be empty").max(60),
  keywords: z.string().trim().max(300),
  priceKes: kes,
  checklist: z
    .string()
    .trim()
    .min(1, "Checklist can't be empty")
    .max(3500, "WhatsApp messages max out at 4,096 characters; keep it under 3,500"),
  active: z.literal("on").optional(),
});

export async function updateService(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = serviceSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
  const { id, active, ...rest } = parsed.data;
  const db = await getDb();
  await db
    .update(schema.services)
    .set({ ...rest, active: active === "on", updatedAt: new Date() })
    .where(eq(schema.services.id, id));
  refresh();
  return { ok: true, message: "Saved. The bot uses this from the next message." };
}

/* ---------- Demo data ---------- */

export async function clearDemoData() {
  const db = await getDb();
  await db.delete(schema.orders).where(eq(schema.orders.isDemo, true));
  await db.delete(schema.products).where(eq(schema.products.isDemo, true));
  await db.delete(schema.leads).where(eq(schema.leads.isDemo, true));
  await db.delete(schema.contacts).where(eq(schema.contacts.isDemo, true)); // cascades messages
  refresh();
}
