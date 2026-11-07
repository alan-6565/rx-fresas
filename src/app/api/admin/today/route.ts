import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, refreshSite } from "@/lib/admin-catalog";
import { formatRange, pacificWeekday, type WeekHours } from "@/lib/schedule";
import { pacificDate } from "@/lib/time";

// The "Not today" switch: R&X can close a stop for the rest of today from the
// dashboard. Only closed_on changes here; hours and the rest stay as they are.

type Row = { id: string; name: string; address: string; city: string; hours: WeekHours; closed_on: string | null };

export async function GET() {
  const today = pacificDate();
  const { data, error } = await supabaseAdmin.from("locations").select("id, name, address, city, hours, closed_on").eq("active", true).order("sort").order("created_at");
  if (error) return bad("Couldn't load the locations", 500);
  const day = pacificWeekday();
  const spots = (data as Row[]).map((r) => {
    const d = r.hours?.[day];
    return { id: r.id, name: r.name, place: r.address || r.city, hoursToday: d?.open ? formatRange(d) : null, closedToday: r.closed_on === today };
  });
  return NextResponse.json({ spots });
}

export async function PATCH(req: NextRequest) {
  const { id, closed } = (await req.json().catch(() => ({}))) as { id?: string; closed?: boolean };
  if (!id || typeof closed !== "boolean") return bad("Pick a location");
  const { data, error } = await supabaseAdmin
    .from("locations")
    .update({ closed_on: closed ? pacificDate() : null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("active", true)
    .select("id")
    .maybeSingle();
  if (error) return bad("Couldn't save", 500);
  if (!data) return bad("Location not found", 404);
  refreshSite();
  return NextResponse.json({ ok: true });
}
