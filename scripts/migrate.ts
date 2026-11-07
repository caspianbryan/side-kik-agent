/**
 * Sets up the Neon database: `npm run db:migrate`
 *   - creates/updates the tables
 *   - adds the 5 services if there are none
 *   - `npm run db:migrate -- --demo` also adds demo chats and leads
 *
 * Safety: refuses to run on a database that already holds other apps' tables
 * (for example Rada's), unless you pass --force.
 * Local PGlite (DATABASE_URL empty) migrates itself when the app starts.
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { sql } from "drizzle-orm";
import * as schema from "../src/db/schema";
import { SERVICE_SEED, seedDemo } from "../src/db/seed";

config({ path: ".env.local" });

const HUB_TABLES = new Set(["services", "contacts", "messages", "leads", "settings", "products", "delivery_zones", "orders", "order_items"]);

async function main() {
  // Forgive common .env slips: a stray "=", surrounding quotes or spaces.
  const url = (process.env.DATABASE_URL ?? "").trim().replace(/^=+/, "").trim().replace(/^['"]|['"]$/g, "");
  if (!url) {
    console.log("DATABASE_URL is empty, so the app uses the local database, which sets itself up. Nothing to do.");
    return;
  }
  const args = process.argv.slice(2);
  const client = neon(url);

  const tables = (await client`
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
  `) as { table_name: string }[];
  const foreign = tables.map((t) => t.table_name).filter((n) => !HUB_TABLES.has(n));
  if (foreign.length && !args.includes("--force")) {
    console.error(
      `This database already has other tables (${foreign.slice(0, 6).join(", ")}${foreign.length > 6 ? ", …" : ""}).\n` +
        "It may belong to another app. Create a new database for the hub in Neon and use its URL.\n" +
        "If you're sure, run: npm run db:migrate -- --force",
    );
    process.exit(1);
  }

  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: "./drizzle" });

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.services);
  if (count === 0) await db.insert(schema.services).values(SERVICE_SEED);
  if (args.includes("--demo")) await seedDemo(db as never);

  console.log(
    "✓ Tables ready" +
      (count === 0 ? ", 5 services added" : "") +
      (args.includes("--demo") ? ", demo data added" : "") +
      ". Start the app with: npm run dev",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
