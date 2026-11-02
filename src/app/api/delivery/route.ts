import { NextRequest, NextResponse } from "next/server";
import { getSpots } from "@/lib/catalog";
import { getDelivery } from "@/lib/delivery-store";
import { quoteDelivery } from "@/lib/geo";
import type { Address } from "@/lib/delivery";

/** The delivery fee for an address, shown at checkout before paying (checkout works it out again) */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { address?: Partial<Address>; location?: string };
  const [spots, settings] = await Promise.all([getSpots(), getDelivery()]);
  if (!settings.on) return NextResponse.json({ error: "Por ahora solo tenemos pickup en el truck." }, { status: 400 });
  const spot = spots.find((s) => s.name === body.location);
  if (!spot) return NextResponse.json({ error: "Elige una ubicación." }, { status: 400 });
  const a = body.address ?? {};
  const q = await quoteDelivery({ street: String(a.street ?? "").slice(0, 120), unit: "", city: String(a.city ?? "").slice(0, 60), zip: String(a.zip ?? "").trim() }, spot, settings);
  return NextResponse.json(q, { status: "error" in q ? 400 : 200 });
}
