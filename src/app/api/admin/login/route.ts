import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, roleForPassword } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const role = roleForPassword(password);
  // A short wait slows down password guessing
  if (!role) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, (await adminToken(role))!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days, so the truck's iPad stays signed in
  });
  return res;
}
