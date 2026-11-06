import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, safeEqual, sessionToken } from "@/lib/auth";
import { missingSettings } from "@/lib/setup";

/**
 * Keeps the hub behind the sign-in page (password = HUB_PASSWORD).
 * If the deployment is missing required settings, every page shows the setup guide on /login.
 * The Meta webhook and the public privacy page are excluded in the matcher.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const password = process.env.HUB_PASSWORD;

  if (missingSettings().length) {
    return pathname === "/login" ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
  }

  // Local development without a password: the hub is open.
  if (!password) {
    return pathname === "/login" ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  const signedIn = cookie !== "" && safeEqual(cookie, await sessionToken(password));

  if (pathname === "/login") {
    return signedIn ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }
  if (signedIn) return NextResponse.next();

  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!api/whatsapp|privacy|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
