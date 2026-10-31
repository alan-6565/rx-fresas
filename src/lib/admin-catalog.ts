import "server-only";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { validHours } from "@/lib/schedule";
import { cleanGroups } from "@/lib/options";

// Checks for what the dashboard sends when it edits the menu and locations.

export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

/** The whole public site reads the menu and spots, so rebuild all of it */
export function refreshSite() {
  revalidatePath("/", "layout");
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

/** "Fresa con Nutella" → "fresa-con-nutella" */
export function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "item"
  );
}

/** Only the fields that were sent, checked; throws a message for the staff */
export function menuItemFields(b: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if ("name" in b) {
    const name = text(b.name, 60);
    if (!name) throw new Error("Give the item a name.");
    out.name = name;
  }
  if ("description" in b) out.description = text(b.description, 160) ?? "";
  if ("price" in b) {
    const cents = Math.round(Number(b.price) * 100);
    if (!Number.isFinite(cents) || cents < 50 || cents > 100000) throw new Error("Price must be between $0.50 and $1,000.");
    out.price_cents = cents;
  }
  if ("category" in b) {
    const c = text(b.category, 40);
    if (!c) throw new Error("Pick a category.");
    out.category_id = c;
  }
  if ("image" in b) out.image_url = text(b.image, 500) ?? "";
  if ("available" in b) out.available = !!b.available;
  if ("sort" in b && Number.isInteger(b.sort)) out.sort = b.sort;
  if ("options" in b) out.options = cleanGroups(b.options);
  return out;
}

export function locationFields(b: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if ("name" in b) {
    const name = text(b.name, 60);
    if (!name) throw new Error("Give the location a name.");
    out.name = name;
  }
  if ("city" in b) out.city = text(b.city, 60) ?? "";
  if ("address" in b) out.address = text(b.address, 160) ?? "";
  for (const key of ["lat", "lng"] as const) {
    if (!(key in b)) continue;
    if (b[key] === null || b[key] === "") {
      out[key] = null;
      continue;
    }
    const n = Number(b[key]);
    const limit = key === "lat" ? 90 : 180;
    if (!Number.isFinite(n) || Math.abs(n) > limit) throw new Error("Those coordinates don't look right.");
    out[key] = n;
  }
  if ("image" in b) out.image_url = text(b.image, 500) ?? "";
  if ("active" in b) out.active = !!b.active;
  if ("hours" in b) {
    if (!validHours(b.hours)) throw new Error("Each open day needs a closing time after its opening time.");
    out.hours = b.hours.map((d) => ({ open: d.open, start: d.start, end: d.end }));
  }
  if ("closedOn" in b) {
    const v = b.closedOn;
    if (v !== null && !(typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v))) throw new Error("Bad date.");
    out.closed_on = v;
  }
  if ("sort" in b && Number.isInteger(b.sort)) out.sort = b.sort;
  return out;
}
