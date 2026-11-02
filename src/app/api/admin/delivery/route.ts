import { NextRequest, NextResponse } from "next/server";
import { bad, refreshSite } from "@/lib/admin-catalog";
import { cleanDelivery } from "@/lib/delivery";
import { saveDelivery } from "@/lib/delivery-store";

/** Saves Dashboard → Settings → Delivery */
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const settings = cleanDelivery(body);
  if (settings.on && settings.zips.length === 0) return bad("Add at least one ZIP code you deliver to");
  try {
    await saveDelivery(settings);
  } catch {
    return bad("Couldn't save", 500);
  }
  refreshSite();
  return NextResponse.json({ delivery: settings });
}
