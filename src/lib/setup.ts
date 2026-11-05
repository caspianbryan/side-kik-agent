// Settings the deployed hub can't run without. Shared by proxy.ts and the sign-in page.

export function missingSettings(): string[] {
  if (process.env.NODE_ENV !== "production") return [];
  const missing: string[] = [];
  if (!process.env.HUB_PASSWORD) missing.push("HUB_PASSWORD");
  // The local file database can't run on Vercel; production needs Neon.
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  return missing;
}
