import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin-auth";

// Everything under /admin and /api/admin needs the staff password, except the
// login page and the login call itself.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();

  if (await isAdminToken(req.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const login = new URL("/admin/login", req.url);
  login.searchParams.set("from", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
