import { NextRequest, NextResponse } from "next/server";

// Session-cookie auth gate for the whole ops app (clients, projects, eyespy).
// Requires ADMIN_USER, ADMIN_PASSWORD, and SESSION_SECRET as Vercel env vars —
// without SESSION_SECRET set, no session cookie can ever validate (fails closed).
// /api/cron is excluded because Vercel Cron calls it directly with no session
// cookie — it has its own CRON_SECRET bearer-token check in the route handler.
const PUBLIC_PATHS = ["/login", "/api/login", "/api/logout", "/api/cron"];

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
