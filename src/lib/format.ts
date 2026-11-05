export function kes(n: number) {
  return `KES ${n.toLocaleString("en-KE")}`;
}

export function phone(waId: string) {
  // 254712345678 -> +254 712 345 678
  const m = waId.match(/^(\d{3})(\d{3})(\d{3})(\d{3})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+${waId}`;
}

/** Two-letter initials for avatars; "Demo · Wanjiku" -> "WA". */
export function initials(name: string | null | undefined, fallback = "?") {
  const clean = (name ?? "").replace(/^Demo\s*·\s*/, "").trim();
  if (!clean) return fallback;
  const parts = clean.split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : clean.slice(0, 2)).toUpperCase();
}

export function timeAgo(d: Date | string | null | undefined) {
  if (!d) return "";
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", timeZone: "Africa/Nairobi" });
}

export function clock(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
}
