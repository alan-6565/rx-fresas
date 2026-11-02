// R&X's delivery settings, edited in Dashboard → Settings → Delivery and stored
// in the settings table under "delivery" (JSON). Safe to use in the browser.
//
// The fee follows the miles from wherever the truck is parked to the
// customer's door: a base fee, plus gas (price per gallon ÷ the car's miles per
// gallon) and any extra per mile, there and back when roundTrip is on.

export type DeliverySettings = {
  on: boolean;
  baseCents: number;
  /** Price of a gallon of gas, in cents */
  gasCents: number;
  /** The delivery car's miles per gallon */
  mpg: number;
  /** On top of gas, per mile driven (driver's time, wear on the car) */
  perMileCents: number;
  /** Charge for the drive back to the truck too */
  roundTrip: boolean;
  /** Farthest they'll go, one way */
  maxMiles: number;
  /** Smallest food total (before fees) they'll deliver */
  minCents: number;
  /** Extra minutes on top of the pickup lead time */
  extraMinutes: number;
};

export const DEFAULT_DELIVERY: DeliverySettings = {
  on: true,
  baseCents: 300,
  gasCents: 620,
  mpg: 25,
  perMileCents: 0,
  roundTrip: true,
  maxMiles: 8,
  minCents: 1500,
  extraMinutes: 15,
};

const num = (v: unknown, min: number, max: number, fallback: number, round = true) => {
  const n = round ? Math.round(Number(v)) : Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
};

export function cleanDelivery(raw: unknown): DeliverySettings {
  const v = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<keyof DeliverySettings, unknown>>;
  const d = DEFAULT_DELIVERY;
  return {
    on: v.on === undefined ? d.on : v.on === true,
    baseCents: num(v.baseCents, 0, 5000, d.baseCents),
    gasCents: num(v.gasCents, 100, 2000, d.gasCents),
    mpg: Math.round(num(v.mpg, 5, 150, d.mpg, false) * 10) / 10,
    perMileCents: num(v.perMileCents, 0, 1000, d.perMileCents),
    roundTrip: v.roundTrip === undefined ? d.roundTrip : v.roundTrip === true,
    maxMiles: Math.round(num(v.maxMiles, 1, 50, d.maxMiles, false) * 10) / 10,
    minCents: num(v.minCents, 0, 20000, d.minCents),
    extraMinutes: num(v.extraMinutes, 0, 120, d.extraMinutes),
  };
}

/** Cost of each mile driven, in cents (can have fractions) */
export const centsPerMile = (s: DeliverySettings) => s.gasCents / s.mpg + s.perMileCents;

/** Delivery fee for a one-way distance, rounded up to the next 25¢ */
export function deliveryFee(miles: number, s: DeliverySettings): number {
  const driven = miles * (s.roundTrip ? 2 : 1);
  return Math.ceil((s.baseCents + driven * centsPerMile(s)) / 25) * 25;
}

export type Address = { street: string; unit: string; city: string; zip: string };

/** One line for the order, the staff and the emails */
export const addressLine = (a: Address) => [a.street, a.unit && `#${a.unit.replace(/^#/, "")}`, `${a.city}, CA ${a.zip}`].filter(Boolean).join(", ");

/** What's missing from the address, in Spanish, or "" */
export function addressProblem(a: Address): string {
  if (!a.street.trim() || !a.city.trim() || !a.zip.trim()) return "Escribe tu dirección completa.";
  if (!/^\d{5}$/.test(a.zip.trim())) return "El código postal debe tener 5 números.";
  return "";
}

/** "3.2 mi" */
export const milesText = (miles: number) => `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
