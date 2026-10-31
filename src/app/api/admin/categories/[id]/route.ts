import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, refreshSite } from "@/lib/admin-catalog";

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/admin/categories/[id]">) {
  const { id } = await params;
  const { label, title, sort } = (await req.json().catch(() => ({}))) as { label?: string; title?: string; sort?: number };
  const fields: Record<string, string | number> = {};
  if (Number.isInteger(sort)) fields.sort = sort as number;
  if (label !== undefined) fields.label = label.trim().slice(0, 40);
  if (title !== undefined) fields.title = title.trim().slice(0, 60);
  if (fields.label === "" || fields.title === "") return bad("Names can't be empty.");

  const { data, error } = await supabaseAdmin.from("menu_categories").update(fields).eq("id", id).select("id, label, title, sort").maybeSingle();
  if (error) return bad("Couldn't save the category", 500);
  if (!data) return bad("Category not found", 404);
  refreshSite();
  return NextResponse.json({ category: data });
}

export async function DELETE(_req: NextRequest, { params }: RouteContext<"/api/admin/categories/[id]">) {
  const { id } = await params;
  const { count } = await supabaseAdmin.from("menu_items").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) return bad("Move or delete the items in this category first.", 409);
  const { error } = await supabaseAdmin.from("menu_categories").delete().eq("id", id);
  if (error) return bad("Couldn't delete the category", 500);
  refreshSite();
  return NextResponse.json({ ok: true });
}
