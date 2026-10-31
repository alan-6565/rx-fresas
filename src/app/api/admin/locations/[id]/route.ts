import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, locationFields, refreshSite } from "@/lib/admin-catalog";

const COLUMNS = "id, name, city, address, lat, lng, image_url, active, hours, closed_on, sort";

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/admin/locations/[id]">) {
  const { id } = await params;
  let fields;
  try {
    fields = locationFields((await req.json().catch(() => ({}))) as Record<string, unknown>);
  } catch (e) {
    return bad((e as Error).message);
  }
  const { data, error } = await supabaseAdmin
    .from("locations")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();
  if (error) return bad("Couldn't save the location", 500);
  if (!data) return bad("Location not found", 404);
  refreshSite();
  return NextResponse.json({ location: data });
}

// Past orders keep the spot's name, so deleting is safe
export async function DELETE(_req: NextRequest, { params }: RouteContext<"/api/admin/locations/[id]">) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("locations").delete().eq("id", id);
  if (error) return bad("Couldn't delete the location", 500);
  refreshSite();
  return NextResponse.json({ ok: true });
}
