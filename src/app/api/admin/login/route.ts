import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const expected = process.env.ADMIN_PASSWORD;
  // A short wait slows down password guessing
  if (!expected || password !== expected) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, (await adminToken())!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days, so the truck's iPad stays signed in
  });
  return res;
}
