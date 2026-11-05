import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { LEAD_KINDS, LEAD_STAGES } from "../lib/constants";

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

export type Service = typeof services.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Lead = typeof leads.$inferSelect;
