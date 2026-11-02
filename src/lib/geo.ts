import "server-only";
import type { Address, DeliverySettings } from "@/lib/delivery";
import { addressLine, addressProblem, deliveryFee, milesText } from "@/lib/delivery";
import type { Spot } from "@/lib/schedule";

// Finds a customer's address with the US Census geocoder (free, no key) and
// prices delivery from the truck's spot. Distance is the straight line times a
// road factor, since streets don't go in straight lines.

const ROAD_FACTOR = 1.3;

export type Point = { lat: number; lng: number };

/** Miles between two points (haversine) */
export function crowMiles(a: Point, b: Point) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

const cache = new Map<string, { point: Point; matched: string } | null>();

export async function geocode(address: string): Promise<{ point: Point; matched: string } | null> {
  const key = address.toLowerCase().replace(/\s+/g, " ").trim();
  if (cache.has(key)) return cache.get(key)!;
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!res.ok) throw new Error(`Geocoder ${res.status}`);
  const data = await res.json();
  const m = data?.result?.addressMatches?.[0];
  const found = m ? { point: { lat: m.coordinates.y, lng: m.coordinates.x }, matched: String(m.matchedAddress) } : null;
  if (cache.size > 500) cache.clear();
  cache.set(key, found);
  return found;
}

export type DeliveryQuote = { miles: number; feeCents: number; label: string } | { error: string };

/** Fee from the truck's spot to this address, or why we can't deliver there (in Spanish) */
export async function quoteDelivery(a: Address, spot: Spot, s: DeliverySettings): Promise<DeliveryQuote> {
  const problem = addressProblem(a);
  if (problem) return { error: problem };
  if (spot.lat == null || spot.lng == null) return { error: "No podemos calcular la entrega desde esta parada. Llámanos o recoge en el truck." };
  let found;
  try {
    // The apartment number doesn't help the lookup
    found = await geocode(addressLine({ ...a, unit: "" }));
  } catch {
    return { error: "No pudimos revisar tu dirección ahora. Intenta otra vez en un momento." };
  }
  if (!found) return { error: "No encontramos esa dirección. Revisa la calle y el código postal." };
  const miles = Math.round(crowMiles({ lat: spot.lat, lng: spot.lng }, found.point) * ROAD_FACTOR * 10) / 10;
  if (miles > s.maxMiles) return { error: `Estás a ${milesText(miles)} del truck. Por ahora entregamos hasta ${milesText(s.maxMiles)}. ♡` };
  return { miles, feeCents: deliveryFee(miles, s), label: milesText(miles) };
}
