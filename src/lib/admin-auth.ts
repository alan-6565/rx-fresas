// Two passwords. ADMIN_PASSWORD is the site manager's (everything).
// STAFF_PASSWORD is R&X's own login: orders, menu, customers and the rest,
// but not Locations, Edit Website or Promotions, which the manager runs.
// The cookie holds a signature of the password rather than the password
// itself, so changing either one signs those people out. Web Crypto so it
// runs in the proxy and in routes alike.

export const ADMIN_COOKIE = "rx_admin";

export type AdminRole = "owner" | "staff";

/** Sections (and their API routes) only the site manager sees */
export const OWNER_ONLY = ["/admin/locations", "/admin/website", "/admin/promotions", "/api/admin/locations", "/api/admin/promotions", "/api/admin/photos"];
export const ownerOnly = (pathname: string) => OWNER_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const LABEL: Record<AdminRole, string> = { owner: "rx-fresas-admin-v1", staff: "rx-fresas-staff-v1" };
const PASSWORD: Record<AdminRole, () => string | undefined> = {
  owner: () => process.env.ADMIN_PASSWORD,
  staff: () => process.env.STAFF_PASSWORD,
};

export async function adminToken(role: AdminRole = "owner"): Promise<string | null> {
  const password = PASSWORD[role]();
  if (!password) return null;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(LABEL[role]));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Who a cookie belongs to, or null when it's missing or out of date */
export async function adminRole(value: string | undefined): Promise<AdminRole | null> {
  if (!value) return null;
  for (const role of ["owner", "staff"] as const) {
    const expected = await adminToken(role);
    if (expected && same(value, expected)) return role;
  }
  return null;
}

/** Which login a typed password is for */
export function roleForPassword(password: string | undefined): AdminRole | null {
  if (!password) return null;
  if (process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) return "owner";
  if (process.env.STAFF_PASSWORD && password === process.env.STAFF_PASSWORD) return "staff";
  return null;
}
