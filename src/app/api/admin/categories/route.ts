import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, refreshSite, slugify } from "@/lib/admin-catalog";

export async function POST(req: NextRequest) {
  const { label, title } = (await req.json().catch(() => ({}))) as { label?: string; title?: string };
  const name = label?.trim().slice(0, 40);
  if (!name) return bad("Give the category a name.");

  const base = slugify(name);
  const { data: all } = await supabaseAdmin.from("menu_categories").select("id, sort");
  let id = base;
  for (let n = 2; all?.some((c) => c.id === id); n++) id = `${base}-${n}`;
  const sort = Math.max(0, ...(all ?? []).map((c) => c.sort)) + 1;

  const { data, error } = await supabaseAdmin
    .from("menu_categories")
    .insert({ id, label: name, title: title?.trim().slice(0, 60) || name, sort })
    .select("id, label, title, sort")
    .single();
  if (error) return bad("Couldn't add the category", 500);
  refreshSite();
  return NextResponse.json({ category: data });
}
