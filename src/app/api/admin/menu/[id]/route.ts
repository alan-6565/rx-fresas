import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, menuItemFields, refreshSite } from "@/lib/admin-catalog";

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/admin/menu/[id]">) {
  const { id } = await params;
  let fields;
  try {
    fields = menuItemFields((await req.json().catch(() => ({}))) as Record<string, unknown>);
  } catch (e) {
    return bad((e as Error).message);
  }
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, category_id, name, description, price_cents, image_url, available, sort, options")
    .maybeSingle();
  if (error) return bad("Couldn't save the item", 500);
  if (!data) return bad("Item not found", 404);
  refreshSite();
  return NextResponse.json({ item: data });
}

// Past orders keep their own copy of the name and price, so deleting is safe
export async function DELETE(_req: NextRequest, { params }: RouteContext<"/api/admin/menu/[id]">) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("menu_items").delete().eq("id", id);
  if (error) return bad("Couldn't delete the item", 500);
  refreshSite();
  return NextResponse.json({ ok: true });
}
