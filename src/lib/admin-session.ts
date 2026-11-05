import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminRole } from "@/lib/admin-auth";

/** True for the site manager's login, false for R&X's staff login */
export async function isOwner() {
  return (await adminRole((await cookies()).get(ADMIN_COOKIE)?.value)) === "owner";
}
