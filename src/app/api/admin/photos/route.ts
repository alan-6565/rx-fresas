import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, refreshSite } from "@/lib/admin-catalog";
import { gallery as starterGallery } from "@/lib/data";
import { isPhotoSlot } from "@/lib/site-photos";

// Replaces one photo on the website, wherever it lives:
//   "home.hero", "about.1"… → settings "photo:<slot>"
//   "gallery:<n>" / "gallery:add" → settings "gallery" (JSON list)
//   "item:<id>" → that menu item, "spot:<id>" → that truck location

// Only photos uploaded to our storage, or the site's own files
const okUrl = (url: unknown): url is string =>
  typeof url === "string" &&
  url.length < 500 &&
  (url.startsWith("/images/") || url.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`));

async function readGallery(): Promise<string[]> {
  const { data } = await supabaseAdmin.from("settings").select("value").eq("key", "gallery").maybeSingle();
  try {
    const list = JSON.parse(data?.value ?? "null");
    if (Array.isArray(list)) return list;
  } catch {}
  return [...starterGallery];
}

const saveSetting = (key: string, value: string) =>
  supabaseAdmin.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }).then(({ error }) => {
    if (error) throw error;
  });

export async function POST(req: NextRequest) {
  const { slot, url } = (await req.json().catch(() => ({}))) as { slot?: string; url?: string };
  if (!slot || !okUrl(url)) return bad("That photo can't be used.");

  try {
    if (slot.startsWith("item:")) {
      const { data, error } = await supabaseAdmin.from("menu_items").update({ image_url: url, updated_at: new Date().toISOString() }).eq("id", slot.slice(5)).select("id");
      if (error || !data?.length) return bad("Menu item not found", 404);
    } else if (slot.startsWith("spot:")) {
      const { data, error } = await supabaseAdmin.from("locations").update({ image_url: url, updated_at: new Date().toISOString() }).eq("id", slot.slice(5)).select("id");
      if (error || !data?.length) return bad("Location not found", 404);
    } else if (slot.startsWith("gallery:")) {
      const list = await readGallery();
      if (slot === "gallery:add") {
        if (list.length >= 60) return bad("The gallery is full (60 photos).");
        list.unshift(url); // newest first
      } else {
        const i = Number(slot.slice(8));
        if (!Number.isInteger(i) || i < 0 || i >= list.length) return bad("That gallery photo moved. Reload and try again.", 409);
        list[i] = url;
      }
      await saveSetting("gallery", JSON.stringify(list));
    } else if (isPhotoSlot(slot)) {
      await saveSetting(`photo:${slot}`, url);
    } else {
      return bad("Unknown photo spot");
    }
  } catch {
    return bad("Couldn't save the photo", 500);
  }
  refreshSite();
  return NextResponse.json({ ok: true });
}

/** Puts a site photo back to the original, or takes one out of the gallery */
export async function DELETE(req: NextRequest) {
  const { slot } = (await req.json().catch(() => ({}))) as { slot?: string };
  try {
    if (slot?.startsWith("gallery:")) {
      const list = await readGallery();
      const i = Number(slot.slice(8));
      if (!Number.isInteger(i) || i < 0 || i >= list.length) return bad("That gallery photo moved. Reload and try again.", 409);
      list.splice(i, 1);
      await saveSetting("gallery", JSON.stringify(list));
    } else if (slot && isPhotoSlot(slot)) {
      const { error } = await supabaseAdmin.from("settings").delete().eq("key", `photo:${slot}`);
      if (error) throw error;
    } else {
      return bad("Only website photos can be reset");
    }
  } catch {
    return bad("Couldn't update the photo", 500);
  }
  refreshSite();
  return NextResponse.json({ ok: true });
}
