import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, adminRole, ownerOnly } from "@/lib/admin-auth";

// Everything under /admin and /api/admin needs a password, except the login
// page and the login call itself. R&X's staff login doesn't reach the
// sections the site manager runs.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login" || pathname === "/api/admin/login") return NextResponse.next();

  const role = await adminRole(req.cookies.get(ADMIN_COOKIE)?.value);
  if (role === "owner" || (role === "staff" && !ownerOnly(pathname))) return NextResponse.next();

  if (role === "staff") {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not available" }, { status: 403 });
    return NextResponse.redirect(new URL("/admin", req.url));
  }
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const login = new URL("/admin/login", req.url);
  login.searchParams.set("from", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
