import "server-only";
import { cache } from "react";
import { gallery as starterGallery } from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase";

// The website's own photos (hero, story, gallery…) that staff can replace from
// Dashboard → Edit Website. Stored in the settings table as "photo:<slot>" and
// "gallery" (a JSON list); anything not replaced uses the original file.
// Menu item and truck photos live on their own rows, under slots
// "item:<id>" and "spot:<id>".

export const DEFAULT_PHOTOS = {
  "home.hero": "/images/hero.jpg",
  "home.story": "/images/historia.jpg",
  "about.story": "/images/historia.jpg",
  "about.1": "/images/gal-prep.jpg",
  "about.2": "/images/gal-cup.jpg",
  "about.3": "/images/gal-pancakes.jpg",
} as const;
export type PhotoSlot = keyof typeof DEFAULT_PHOTOS;

export const isPhotoSlot = (s: string): s is PhotoSlot => s in DEFAULT_PHOTOS;

export type SitePhotos = { photo: (slot: PhotoSlot) => string; gallery: string[] };

export const getSitePhotos = cache(async (): Promise<SitePhotos> => {
  let rows: { key: string; value: string }[] = [];
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data, error } = await supabaseAdmin.from("settings").select("key, value").or("key.like.photo:%,key.eq.gallery");
    if (error) throw error;
    rows = data;
  }
  const saved = new Map(rows.map((r) => [r.key, r.value]));
  let gallery = starterGallery;
  try {
    const list = JSON.parse(saved.get("gallery") ?? "null");
    if (Array.isArray(list) && list.every((u) => typeof u === "string")) gallery = list;
  } catch {}
  return { photo: (slot) => saved.get(`photo:${slot}`) || DEFAULT_PHOTOS[slot], gallery };
});
