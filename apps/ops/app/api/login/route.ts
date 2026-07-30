import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!expectedUser || !expectedPass || !secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const { username, password } = body as { username?: string; password?: string };

  if (username !== expectedUser || password !== expectedPass) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("ops_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
