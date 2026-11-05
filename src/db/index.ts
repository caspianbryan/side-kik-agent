import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

/** Forgives common .env slips: a stray "=", surrounding quotes or spaces. */
export function cleanUrl(raw: string | undefined) {
  return (raw ?? "").trim().replace(/^=+/, "").trim().replace(/^['"]|['"]$/g, "");
}

async function connect(): Promise<DB> {
  const url = cleanUrl(process.env.DATABASE_URL);

  if (url) {
    // Neon Postgres over HTTPS (works on any Node version, no WebSockets needed).
    // Create the tables once with `npm run db:migrate`.
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const sql = neon(url);
    const rows = (await sql`select to_regclass('public.services') as t`) as { t: string | null }[];
    if (!rows[0]?.t) {
      throw new Error(
        "Your Neon database doesn't have the hub's tables yet. Run `npm run db:migrate` once, then restart.",
      );
    }
    return drizzle({ client: sql, schema }) as unknown as DB;
  }

  // Local: PGlite (Postgres compiled to WASM) stored in ./data. No install needed.
  // It migrates and seeds itself on first start.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = path.join(process.cwd(), "data", "pglite");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const local = drizzle({ client, schema });
  await migrate(local, { migrationsFolder: MIGRATIONS });
  const db = local as unknown as DB;
  await seedIfEmpty(db);
  return db;
}

// One connection per server process (survives dev hot reloads).
const g = globalThis as unknown as { __hubDb?: Promise<DB> };

export function getDb(): Promise<DB> {
  if (!g.__hubDb) {
    g.__hubDb = connect().catch((err) => {
      g.__hubDb = undefined;
      throw err;
    });
  }
  return g.__hubDb;
}

export { schema };
