import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

export type DB = PgDatabase<PgQueryResultHKT, typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;

  if (url) {
    // Deployed: Neon Postgres. Run `npm run db:migrate` once before first deploy.
    const { Pool } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-serverless");
    const pool = new Pool({ connectionString: url });
    const { rows } = await pool.query("select to_regclass('public.services') as t");
    if (!rows[0]?.t) {
      throw new Error(
        "DATABASE_URL points to a database without the hub's tables. " +
          "Leave DATABASE_URL empty in .env.local to use the local database, " +
          "or run `npm run db:migrate` (only on a database made for this hub, not Rada's).",
      );
    }
    return drizzle({ client: pool, schema }) as unknown as DB;
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
