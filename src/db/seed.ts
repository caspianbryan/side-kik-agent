import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

// Fees and steps checked 4 Nov 2026. Re-verify on the official sites before going live,
// then keep them current from the Checklists page in the hub.
export const SERVICE_SEED: (typeof schema.services.$inferInsert)[] = [
  {
    slug: "kra-pin",
    name: "KRA PIN",
    menuKey: "1",
    keywords: "kra,pin,itax,tax",
    priceKes: 200,
    checklist: `*KRA PIN (individual)*
Cost: *FREE* · Time: ~10 min

*You need*
• National ID number
• Date of birth
• An email you can open (the PIN is sent there)
• Phone number and address

*Steps*
1. Go to itax.kra.go.ke → New PIN Registration
2. Individual → Online form → Resident Individual
3. Enter ID details, email, contacts
4. Obligation: *Income Tax - Resident Individual* only
5. Submit → PIN certificate arrives by email

⚠️ File a return every year by 30 June, even a nil one.`,
  },
  {
    slug: "good-conduct",
    name: "Certificate of Good Conduct",
    menuKey: "2",
    keywords: "good conduct,dci,police clearance,clearance,conduct",
    priceKes: 300,
    checklist: `*Certificate of Good Conduct (DCI)*
Cost: *KES 1,050* · Time: 7–14 working days · Valid 12 months

*You need*
• Scanned ID (front and back)
• Passport photo, white background
• KRA PIN certificate (if employed)

*Steps*
1. Register on the DCI portal via eCitizen, verify the OTP
2. Apply for Certificate of Good Conduct
3. Details *exactly* as on your ID + reason
4. Upload documents, pay, save the receipt
5. Book fingerprinting (DCI HQ, Huduma Centre or DCI office)
6. Track with your reference, collect or courier

Help: DCI 0800 722 203`,
  },
  {
    slug: "sha",
    name: "SHA registration",
    menuKey: "3",
    keywords: "sha,shif,nhif,health,afya",
    priceKes: 200,
    checklist: `*SHA registration*
Registration: *FREE*
Contribution: 2.75% of income, min *KES 300/month*

*You need*
• National ID
• Birth certificates for children/dependants

*Steps*
1. Dial *147# and accept terms
   (or sha.go.ke, or a Huduma Centre with your ID)
2. Add spouse and dependants
3. Self-employed: complete means testing
4. Pay monthly and confirm your status

Help: SHA 0800 720 601`,
  },
  {
    slug: "helb",
    name: "HELB first-time loan",
    menuKey: "4",
    keywords: "helb,loan,student,hef,university",
    priceKes: 500,
    checklist: `*HELB first-time loan*
No application fee · Window opens ~July each year

*You need*
• Your own email + phone in your name
• KCPE & KCSE index numbers and years
• National ID, birth certificate, passport photo
• Admission letter
• Parents' ID numbers and phones
• 2 guarantors' IDs and phones

*Steps*
1. Register on hef.co.ke with YOUR number and ID
2. Activate via the email link (check spam)
3. Complete My Profile, upload documents
4. HELB → Loan Application → First Time Undergraduate
5. Add guarantors + bank details, submit
6. Keep the PDF sent to your email`,
  },
  {
    slug: "passport",
    name: "Passport (first time)",
    menuKey: "5",
    keywords: "passport,immigration,travel",
    priceKes: 500,
    checklist: `*Passport (first time)*
Fee: from *KES 7,550* (34 pages) · confirm on your eCitizen invoice
Time: ~21 working days after biometrics

*You need*
• National ID (original + copy)
• Original birth certificate
• Parents' IDs / birth certificates
• Passport photo

*Steps*
1. eCitizen → Immigration → Apply for a Passport
2. Choose booklet, fill your + parents' details
3. Pay via M-Pesa Paybill 222222 (invoice no. as account)
4. Book biometrics at your nearest centre
5. Attend with originals, collect when SMS arrives`,
  },
];

/** Fills an empty database with the 5 services and clearly-marked demo data. */
export async function seedIfEmpty(db: DB) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.services);
  if (count > 0) return;

  await db.insert(schema.services).values(SERVICE_SEED);
  await seedDemo(db);
}

/** Demo contacts, chats and leads (is_demo = true). Clear them from the hub with one click. */
export async function seedDemo(db: DB) {
  const now = Date.now();
  const minsAgo = (m: number) => new Date(now - m * 60_000);

  const demoContacts = [
    { waId: "254700000001", name: "Demo · Wanjiku", lastServiceSlug: "kra-pin" },
    { waId: "254700000002", name: "Demo · Otieno", lastServiceSlug: "good-conduct" },
    { waId: "254700000003", name: "Demo · Amina", lastServiceSlug: "passport" },
  ];
  const inserted = await db
    .insert(schema.contacts)
    .values(demoContacts.map((c, i) => ({ ...c, isDemo: true, lastSeenAt: minsAgo(10 + i * 45) })))
    .returning();

  const [w, o, a] = inserted;
  await db.insert(schema.messages).values([
    { contactId: w.id, direction: "in", author: "contact", body: "Hi", createdAt: minsAgo(14) },
    { contactId: w.id, direction: "out", author: "bot", body: "(menu)", createdAt: minsAgo(14), deliveryStatus: "logged" },
    { contactId: w.id, direction: "in", author: "contact", body: "1", serviceSlug: "kra-pin", createdAt: minsAgo(12) },
    { contactId: w.id, direction: "out", author: "bot", body: "(KRA PIN checklist)", serviceSlug: "kra-pin", createdAt: minsAgo(12), deliveryStatus: "logged" },
    { contactId: o.id, direction: "in", author: "contact", body: "good conduct", serviceSlug: "good-conduct", createdAt: minsAgo(60) },
    { contactId: o.id, direction: "out", author: "bot", body: "(Good Conduct checklist)", serviceSlug: "good-conduct", createdAt: minsAgo(60), deliveryStatus: "logged" },
    { contactId: o.id, direction: "in", author: "contact", body: "AGENT", serviceSlug: "good-conduct", createdAt: minsAgo(55) },
    { contactId: o.id, direction: "out", author: "bot", body: "(handoff confirmation)", serviceSlug: "good-conduct", createdAt: minsAgo(55), deliveryStatus: "logged" },
    { contactId: a.id, direction: "in", author: "contact", body: "5", serviceSlug: "passport", createdAt: minsAgo(100) },
    { contactId: a.id, direction: "out", author: "bot", body: "(Passport checklist)", serviceSlug: "passport", createdAt: minsAgo(100), deliveryStatus: "logged" },
  ]);

  await db.insert(schema.leads).values([
    { kind: "application", name: "Demo · Otieno", phone: "254700000002", serviceSlug: "good-conduct", stage: "new", amountKes: 300, contactId: o.id, isDemo: true },
    { kind: "application", name: "Demo · Faith", phone: "254700000004", serviceSlug: "kra-pin", stage: "paid", amountKes: 200, isDemo: true },
    { kind: "sme", name: "Demo · Salon owner", business: "Demo Salon — booking reminders", stage: "contacted", amountKes: 15000, monthlyKes: 2000, isDemo: true },
  ]);
}
