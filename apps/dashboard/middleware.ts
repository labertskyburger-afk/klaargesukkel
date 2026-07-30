import { NextRequest, NextResponse } from "next/server";

// Basic HTTP auth gate. Set ADMIN_USER and ADMIN_PASSWORD as Vercel environment
// variables for this project — without them set, every request is rejected (fails
// closed, not open). Same pattern as apps/admin — can share the same credentials.
export function middleware(req: NextRequest) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASSWORD;

  const unauthorized = () =>
    new NextResponse("Authentication required.", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Klaargesukkel Dashboard"' },
    });

  if (!expectedUser || !expectedPass) return unauthorized();

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) return unauthorized();

  const decoded = Buffer.from(auth.split(" ")[1], "base64").toString("utf-8");
  const [user, pass] = decoded.split(":");

  if (user !== expectedUser || pass !== expectedPass) return unauthorized();

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
