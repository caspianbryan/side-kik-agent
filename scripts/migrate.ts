/**
 * For deployed (Neon) databases only: `npm run db:migrate`.
 * Local PGlite migrates and seeds itself when the app starts.
 */
import { config } from "dotenv";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import * as schema from "../src/db/schema";
import { SERVICE_SEED } from "../src/db/seed";
import { sql } from "drizzle-orm";

config({ path: ".env.local" });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL is empty, so the app uses local PGlite, which migrates itself. Nothing to do.");
    return;
  }
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema });
  await migrate(db, { migrationsFolder: "./drizzle" });

  // Real services only; no demo data on a deployed database.
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.services);
  if (count === 0) await db.insert(schema.services).values(SERVICE_SEED);

  console.log("Migrated" + (count === 0 ? " and seeded the 5 services." : "."));
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
