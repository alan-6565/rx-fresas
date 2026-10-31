import "server-only";
import { cache } from "react";
import { categories as starterCategories, items as starterItems, locations as starterLocations, type Item } from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase";
import type { Spot, WeekHours } from "@/lib/schedule";

// The menu and locations the staff edit from the dashboard. Pages read them
// here; the dashboard's API routes call revalidatePath after every change so
// the website shows the new version on the next visit.

export type Category = { id: string; label: string; title: string; sort: number };
export type Menu = { categories: Category[]; items: Item[] };

export type MenuItemRow = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url: string;
  available: boolean;
  sort: number;
};

export type LocationRow = {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  image_url: string;
  active: boolean;
  hours: WeekHours;
  closed_on: string | null;
  sort: number;
};

export const FALLBACK_IMAGE = "/images/logo.png";

const configured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

export const toItem = (r: MenuItemRow): Item => ({
  id: r.id,
  name: r.name,
  price: r.price_cents / 100,
  desc: r.description,
  image: r.image_url || FALLBACK_IMAGE,
  category: r.category_id,
});

export const toSpot = (r: LocationRow): Spot => ({
  id: r.id,
  name: r.name,
  city: r.city,
  address: r.address,
  lat: r.lat,
  lng: r.lng,
  image: r.image_url || "/images/truck-portal.jpg",
  active: r.active,
  hours: r.hours,
  closedOn: r.closed_on,
});

/** What customers can see and order: available items only */
export const getMenu = cache(async (): Promise<Menu> => {
  // Without keys (a local build with no .env) the site still renders the starter menu
  if (!configured()) return { categories: starterCategories.map((c, i) => ({ ...c, sort: i })), items: starterItems };

  const [cats, rows] = await Promise.all([
    supabaseAdmin.from("menu_categories").select("id, label, title, sort").order("sort"),
    supabaseAdmin.from("menu_items").select("*").eq("available", true).order("sort").order("name"),
  ]);
  if (cats.error) throw cats.error;
  if (rows.error) throw rows.error;
  return { categories: cats.data, items: (rows.data as MenuItemRow[]).map(toItem) };
});

/** Spots shown on the website and offered for pickup */
export const getSpots = cache(async (): Promise<Spot[]> => {
  if (!configured()) {
    const everyDay = Array.from({ length: 7 }, () => ({ open: true, start: "18:00", end: "22:00" }));
    return starterLocations.map((l, i) => ({ id: String(i), name: l.name, city: l.city, address: "", lat: null, lng: null, image: l.image, active: true, hours: everyDay, closedOn: null }));
  }
  const { data, error } = await supabaseAdmin.from("locations").select("*").eq("active", true).order("sort").order("created_at");
  if (error) throw error;
  return (data as LocationRow[]).map(toSpot);
});
