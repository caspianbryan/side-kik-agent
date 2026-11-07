import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

export async function getServices() {
  const db = await getDb();
  return db.select().from(schema.services).orderBy(asc(schema.services.menuKey));
}

export async function getDashboard() {
  const db = await getDb();
  const { contacts, messages, leads, services } = schema;

  const [chats] = await db.select({ n: sql<number>`count(*)::int` }).from(contacts);
  const [demo] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contacts)
    .where(eq(contacts.isDemo, true));
  const [demoLeads] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(leads)
    .where(eq(leads.isDemo, true));

  const [paidSme] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(eq(leads.kind, "sme"), inArray(leads.stage, ["paid", "done"])));
  const [paidApps] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(eq(leads.kind, "application"), inArray(leads.stage, ["paid", "done"])));
  const [revenue] = await db
    .select({
      once: sql<number>`coalesce(sum(${leads.amountKes}), 0)::int`,
      monthly: sql<number>`coalesce(sum(${leads.monthlyKes}), 0)::int`,
    })
    .from(leads)
    .where(inArray(leads.stage, ["paid", "done"]));
  const [open] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(leads)
    .where(inArray(leads.stage, ["new", "contacted"]));

  const perService = await db
    .select({
      slug: services.slug,
      name: services.name,
      n: sql<number>`count(${messages.id})::int`,
    })
    .from(services)
    .leftJoin(
      messages,
      and(eq(messages.serviceSlug, services.slug), eq(messages.direction, "in")),
    )
    .groupBy(services.slug, services.name, services.menuKey)
    .orderBy(asc(services.menuKey));

  const recent = await db
    .select({
      id: messages.id,
      body: messages.body,
      createdAt: messages.createdAt,
      contactId: contacts.id,
      name: contacts.name,
      waId: contacts.waId,
    })
    .from(messages)
    .innerJoin(contacts, eq(messages.contactId, contacts.id))
    .where(eq(messages.direction, "in"))
    .orderBy(desc(messages.createdAt))
    .limit(6);

  return {
    chats: chats.n,
    hasDemo: demo.n + demoLeads.n > 0,
    paidSme: paidSme.n,
    paidApps: paidApps.n,
    revenueOnce: revenue.once,
    revenueMonthly: revenue.monthly,
    openLeads: open.n,
    perService,
    recent,
  };
}

export async function getInbox() {
  const db = await getDb();
  const { contacts, messages } = schema;
  const last = db
    .selectDistinctOn([messages.contactId], {
      contactId: messages.contactId,
      body: messages.body,
      direction: messages.direction,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .orderBy(messages.contactId, desc(messages.createdAt))
    .as("last");

  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      waId: contacts.waId,
      isDemo: contacts.isDemo,
      lastServiceSlug: contacts.lastServiceSlug,
      lastBody: last.body,
      lastDirection: last.direction,
      lastAt: last.createdAt,
    })
    .from(contacts)
    .leftJoin(last, eq(last.contactId, contacts.id))
    .orderBy(desc(contacts.lastSeenAt));
}

export async function getThread(contactId: number) {
  const db = await getDb();
  const [contact] = await db
    .select()
    .from(schema.contacts)
    .where(eq(schema.contacts.id, contactId))
    .limit(1);
  if (!contact) return null;
  const thread = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.contactId, contactId))
    .orderBy(asc(schema.messages.createdAt), asc(schema.messages.id));
  const leads = await db
    .select()
    .from(schema.leads)
    .where(eq(schema.leads.contactId, contactId))
    .orderBy(desc(schema.leads.createdAt));
  return { contact, thread, leads };
}

export async function getLeads() {
  const db = await getDb();
  return db.select().from(schema.leads).orderBy(desc(schema.leads.updatedAt));
}

export async function getThreadByWaId(waId: string) {
  const db = await getDb();
  const [contact] = await db
    .select({ id: schema.contacts.id })
    .from(schema.contacts)
    .where(eq(schema.contacts.waId, waId))
    .limit(1);
  return contact ? getThread(contact.id) : null;
}

/* ---------- Shop ---------- */

export async function getProducts() {
  const db = await getDb();
  return db.select().from(schema.products).orderBy(asc(schema.products.sortOrder), asc(schema.products.id));
}

export async function getZones() {
  const db = await getDb();
  return db.select().from(schema.deliveryZones).orderBy(asc(schema.deliveryZones.sortOrder), asc(schema.deliveryZones.id));
}

export async function getOrders() {
  const db = await getDb();
  const rows = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
  if (!rows.length) return [];
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(inArray(schema.orderItems.orderId, rows.map((r) => r.id)));
  return rows.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) }));
}

export async function getHubSettings() {
  const db = await getDb();
  const { getSettings } = await import("./settings");
  return getSettings(db);
}
