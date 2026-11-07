import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { BOT_MODES, LEAD_KINDS, LEAD_STAGES, ORDER_STATUSES, PAYMENT_STATUSES } from "../lib/constants";

/** One service the bot can explain (KRA PIN, Good Conduct, ...). Edited in the hub. */
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** What the user types to pick it from the menu: "1", "2", ... */
  menuKey: text("menu_key").notNull().unique(),
  /** Extra words that also select it, comma separated: "kra,pin,itax". */
  keywords: text("keywords").notNull().default(""),
  /** The WhatsApp reply. Plain text, WhatsApp formatting (*bold*) allowed. */
  checklist: text("checklist").notNull(),
  /** Done-for-you price shown to the user, in KES. */
  priceKes: integer("price_kes").notNull().default(300),
  active: boolean("active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A person who has messaged the number. */
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  /** WhatsApp ID = phone number in international format, no "+". */
  waId: text("wa_id").notNull().unique(),
  name: text("name"),
  /** Last service they asked about, so "AGENT" knows what they want help with. */
  lastServiceSlug: text("last_service_slug"),
  /** Where the customer is in a multi-step chat (shop ordering). Null = at the menu. */
  flow: jsonb("flow").$type<ShopFlow | null>(),
  isDemo: boolean("is_demo").notNull().default(false),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull().defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    contactId: integer("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    direction: text("direction", { enum: ["in", "out"] }).notNull(),
    body: text("body").notNull(),
    serviceSlug: text("service_slug"),
    /** "bot" = automatic reply, "human" = typed by you in the inbox. */
    author: text("author", { enum: ["contact", "bot", "human"] }).notNull(),
    /** Meta's message id; used to ignore duplicate webhook deliveries. */
    waMessageId: text("wa_message_id").unique(),
    /** "sent", "logged" (demo mode / no token) or "failed". */
    deliveryStatus: text("delivery_status"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_contact_idx").on(t.contactId, t.createdAt)],
);

export { LEAD_KINDS, LEAD_STAGES, type LeadKind, type LeadStage } from "../lib/constants";

/** A done-for-you application request or an SME automation client. */
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  kind: text("kind", { enum: LEAD_KINDS }).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  /** Application leads: which service. */
  serviceSlug: text("service_slug"),
  /** SME leads: business name / offer. */
  business: text("business"),
  stage: text("stage", { enum: LEAD_STAGES }).notNull().default("new"),
  /** What they pay you (not the government fee). */
  amountKes: integer("amount_kes").notNull().default(0),
  /** Monthly fee for SME clients. */
  monthlyKes: integer("monthly_kes").notNull().default(0),
  notes: text("notes").notNull().default(""),
  contactId: integer("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------- Shop ---------- */

export type ShopFlow =
  | { step: "browsing" }
  | { step: "qty"; productId: number }
  | { step: "zone"; productId: number; qty: number }
  | { step: "address"; productId: number; qty: number; zoneId: number }
  | { step: "awaiting_payment"; orderId: number };

/** One row (id = 1): who the bot speaks for and how it takes payment. */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  mode: text("mode", { enum: BOT_MODES }).notNull().default("services"),
  businessName: text("business_name").notNull().default("Zola"),
  /** E.g. "Till 123456" or "Paybill 247247, account ZOLA". Shown with every order. */
  paymentInstructions: text("payment_instructions").notNull().default(""),
  /** Short line under the shop menu, e.g. opening hours. */
  greeting: text("greeting").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  priceKes: integer("price_kes").notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  /** Extra words customers might use, comma separated. */
  keywords: text("keywords").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  feeKes: integer("fee_kes").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    /** Human code the customer quotes when paying, e.g. ZL-1042. */
    code: text("code").notNull().unique(),
    contactId: integer("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    customerName: text("customer_name"),
    phone: text("phone"),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("new"),
    paymentStatus: text("payment_status", { enum: PAYMENT_STATUSES }).notNull().default("unpaid"),
    zoneName: text("zone_name"),
    address: text("address").notNull().default(""),
    subtotalKes: integer("subtotal_kes").notNull().default(0),
    deliveryFeeKes: integer("delivery_fee_kes").notNull().default(0),
    totalKes: integer("total_kes").notNull().default(0),
    /** M-Pesa transaction code the customer sent (claimed) and the amount in that message. */
    mpesaCode: text("mpesa_code"),
    mpesaAmountKes: integer("mpesa_amount_kes"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    notes: text("notes").notNull().default(""),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_contact_idx").on(t.contactId), index("orders_mpesa_idx").on(t.mpesaCode)],
);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
  /** Snapshot so old orders keep their name and price if the product changes. */
  name: text("name").notNull(),
  priceKes: integer("price_kes").notNull(),
  qty: integer("qty").notNull().default(1),
});

export type Setting = typeof settings.$inferSelect;
export type Product = typeof products.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

export type Service = typeof services.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Lead = typeof leads.$inferSelect;
