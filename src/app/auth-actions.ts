"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, safeEqual, safeNext, sessionToken } from "@/lib/auth";

export type SignInState = { error?: string };

export async function signIn(_: SignInState, form: FormData): Promise<SignInState> {
  const password = process.env.HUB_PASSWORD;
  if (!password) redirect("/");

  const given = String(form.get("password") ?? "");
  if (!given) return { error: "Enter your password." };

  const [a, b] = await Promise.all([sessionToken(given), sessionToken(password)]);
  if (!safeEqual(a, b)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: "That password isn't right. Check the HUB_PASSWORD setting." };
  }

  (await cookies()).set(SESSION_COOKIE, b, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
