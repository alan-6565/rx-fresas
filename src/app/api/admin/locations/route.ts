import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, locationFields, refreshSite } from "@/lib/admin-catalog";

const COLUMNS = "id, name, city, address, lat, lng, image_url, active, hours, closed_on, sort";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("locations").select(COLUMNS).order("sort").order("created_at");
  if (error) return bad("Couldn't load locations", 500);
  return NextResponse.json({ locations: data });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const closed = { open: false, start: "18:00", end: "22:00" };
  let fields;
  try {
    // New spots start inactive with every day closed, so nothing shows until it's set up
    fields = locationFields({ city: "Richmond, CA", active: false, hours: Array.from({ length: 7 }, () => closed), ...body });
    if (!fields.name) throw new Error("Give the location a name.");
  } catch (e) {
    return bad((e as Error).message);
  }
  const { data: last } = await supabaseAdmin.from("locations").select("sort").order("sort", { ascending: false }).limit(1);
  const { data, error } = await supabaseAdmin
    .from("locations")
    .insert({ sort: (last?.[0]?.sort ?? 0) + 1, ...fields })
    .select(COLUMNS)
    .single();
  if (error) return bad("Couldn't add the location", 500);
  refreshSite();
  return NextResponse.json({ location: data });
}
