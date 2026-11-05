// Shared by proxy.ts and the sign-in action. Uses Web Crypto so it runs anywhere.

export const SESSION_COOKIE = "hub_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function hmac(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie value for a signed-in browser. Changing HUB_PASSWORD signs everyone out. */
export function sessionToken(password: string) {
  return hmac(password, "whatsapp-hub-session-v1");
}

/** Constant-time comparison of two strings of hex/ASCII. */
export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Only allow redirects back into the hub itself. */
export function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
