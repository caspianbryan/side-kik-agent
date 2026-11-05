import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, safeEqual, sessionToken } from "@/lib/auth";

/**
 * Keeps the hub behind the sign-in page (password = HUB_PASSWORD).
 * The Meta webhook is excluded in the matcher so WhatsApp can reach it.
 */
export async function proxy(request: NextRequest) {
  const password = process.env.HUB_PASSWORD;
  const { pathname, search } = request.nextUrl;

  if (!password) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Set HUB_PASSWORD to open the hub.", { status: 503 });
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
  matcher: ["/((?!api/whatsapp|_next/static|_next/image|favicon.ico).*)"],
};
