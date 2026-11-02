// R&X's delivery settings, edited in Dashboard → Settings → Delivery and stored
// in the settings table under "delivery" (JSON). Safe to use in the browser.

export type DeliverySettings = {
  on: boolean;
  feeCents: number;
  /** Smallest food total (before fees) they'll deliver */
  minCents: number;
  /** ZIP codes they deliver to */
  zips: string[];
  /** Extra minutes on top of the pickup lead time */
  extraMinutes: number;
};

export const DEFAULT_DELIVERY: DeliverySettings = {
  on: true,
  feeCents: 500,
  minCents: 1500,
  zips: ["94801", "94803", "94804", "94805", "94806"],
  extraMinutes: 15,
};

const cents = (v: unknown, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 0 && n <= max ? n : fallback;
};

export function cleanDelivery(raw: unknown): DeliverySettings {
  const v = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof DeliverySettings, unknown>>;
  const zips = Array.isArray(v.zips) ? v.zips : typeof v.zips === "string" ? v.zips.split(/[\s,]+/) : DEFAULT_DELIVERY.zips;
  return {
    on: v.on === undefined ? DEFAULT_DELIVERY.on : v.on === true,
    feeCents: cents(v.feeCents, 5000, DEFAULT_DELIVERY.feeCents),
    minCents: cents(v.minCents, 20000, DEFAULT_DELIVERY.minCents),
    zips: [...new Set(zips.map((z) => String(z).trim()).filter((z) => /^\d{5}$/.test(z)))].slice(0, 40),
    extraMinutes: cents(v.extraMinutes, 120, DEFAULT_DELIVERY.extraMinutes),
  };
}

export type Address = { street: string; unit: string; city: string; zip: string };

/** One line for the order, the staff and the emails */
export const addressLine = (a: Address) => [a.street, a.unit && `#${a.unit.replace(/^#/, "")}`, `${a.city}, CA ${a.zip}`].filter(Boolean).join(", ");

/** What's wrong with the address, in Spanish, or "" */
export function addressProblem(a: Address, s: DeliverySettings): string {
  if (!a.street.trim() || !a.city.trim() || !a.zip.trim()) return "Escribe tu dirección completa.";
  if (!/^\d{5}$/.test(a.zip.trim())) return "El código postal debe tener 5 números.";
  if (!s.zips.includes(a.zip.trim())) return "Todavía no entregamos a ese código postal. Puedes recogerlo en el truck. ♡";
  return "";
}
