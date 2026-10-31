import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, menuItemFields, refreshSite, slugify } from "@/lib/admin-catalog";

// Everything on the menu, hidden items included, for the dashboard
export async function GET() {
  const [cats, items] = await Promise.all([
    supabaseAdmin.from("menu_categories").select("id, label, title, sort").order("sort"),
    supabaseAdmin.from("menu_items").select("id, category_id, name, description, price_cents, image_url, available, sort").order("sort").order("name"),
  ]);
  if (cats.error || items.error) return bad("Couldn't load the menu", 500);
  return NextResponse.json({ categories: cats.data, items: items.data });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  let fields;
  try {
    fields = menuItemFields({ available: true, ...body });
    if (!fields.name || fields.price_cents === undefined || !fields.category_id) throw new Error("Name, price and category are needed.");
  } catch (e) {
    return bad((e as Error).message);
  }

  // A readable id that won't change if the item is renamed (carts and past orders use it)
  const base = slugify(String(fields.name));
  const { data: taken } = await supabaseAdmin.from("menu_items").select("id").like("id", `${base}%`);
  let id = base;
  for (let n = 2; taken?.some((t) => t.id === id); n++) id = `${base}-${n}`;

  const { data: last } = await supabaseAdmin.from("menu_items").select("sort").eq("category_id", fields.category_id).order("sort", { ascending: false }).limit(1);
  const { data, error } = await supabaseAdmin
    .from("menu_items")
    .insert({ id, sort: (last?.[0]?.sort ?? 0) + 1, ...fields })
    .select("id, category_id, name, description, price_cents, image_url, available, sort")
    .single();
  if (error) return bad(error.code === "23503" ? "That category doesn't exist anymore." : "Couldn't add the item", 500);
  refreshSite();
  return NextResponse.json({ item: data });
}
