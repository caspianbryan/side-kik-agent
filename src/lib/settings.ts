import "server-only";
import type { DB } from "@/db";
import { schema } from "@/db";

/** The single settings row, created with defaults on first use. */
export async function getSettings(db: DB) {
  const [row] = await db.select().from(schema.settings).limit(1);
  if (row) return row;
  const [created] = await db.insert(schema.settings).values({ id: 1 }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(schema.settings).limit(1))[0];
}
