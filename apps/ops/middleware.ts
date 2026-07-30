import { NextRequest, NextResponse } from "next/server";

// Session-cookie auth gate for the whole ops app (clients, projects, eyespy).
// Requires ADMIN_USER, ADMIN_PASSWORD, and SESSION_SECRET as Vercel env vars —
// without SESSION_SECRET set, no session cookie can ever validate (fails closed).
const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET;
  const session = req.cookies.get("ops_session")?.value;

  if (!secret || !session || session !== secret) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
