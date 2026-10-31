import { TIME_ZONE, pacificDate } from "@/lib/time";

// Weekly hours for a truck spot, used by the website, the order form and the
// checkout check. Times are "HH:MM" (24h) in Pacific time.

export type DayHours = { open: boolean; start: string; end: string };
/** 7 entries, Sunday first (same as Date.getDay) */
export type WeekHours = DayHours[];

export type Spot = {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  image: string;
  active: boolean;
  hours: WeekHours;
  /** Pacific date (YYYY-MM-DD) the "Closed today" switch was turned on for */
  closedOn: string | null;
};

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
/** Monday-first order for lists people read */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const pickupDays = ["Hoy", "Mañana"] as const;
export type PickupDay = (typeof pickupDays)[number];

const SLOT_MINUTES = 15;

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** 18:30 → "6:30 p.m." */
export function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "a.m." : "p.m."}`;
}

/** "6:00 – 10:00 p.m.", or with both halves when they differ ("11:00 a.m. – 2:00 p.m.") */
export function formatRange(d: DayHours) {
  const [a, b] = [formatTime(toMinutes(d.start)), formatTime(toMinutes(d.end))];
  return a.slice(-4) === b.slice(-4) ? `${a.slice(0, -5)} – ${b}` : `${a} – ${b}`;
}

/** Valid if each day has start before end */
export function validHours(hours: unknown): hours is WeekHours {
  return (
    Array.isArray(hours) &&
    hours.length === 7 &&
    hours.every(
      (d) =>
        d &&
        typeof d.open === "boolean" &&
        /^\d{2}:\d{2}$/.test(d.start) &&
        /^\d{2}:\d{2}$/.test(d.end) &&
        toMinutes(d.start) < toMinutes(d.end) &&
        toMinutes(d.end) <= 24 * 60,
    )
  );
}

/** Day of week and minutes since midnight in Pacific time */
function pacificClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

/**
 * Pickup times for a spot on "Hoy" or "Mañana", every 15 minutes while it's
 * open. Today's list starts `leadMinutes` from now so there's time to make it.
 */
export function pickupSlots(spot: Spot, day: PickupDay, leadMinutes = 15, now = new Date()): string[] {
  const offset = day === "Mañana" ? 1 : 0;
  if (spot.closedOn && spot.closedOn === pacificDate(offset, now)) return [];
  const clock = pacificClock(now);
  const hours = spot.hours[(clock.weekday + offset) % 7];
  if (!hours?.open) return [];

  const slots: string[] = [];
  const earliest = offset === 0 ? clock.minutes + leadMinutes : 0;
  for (let m = toMinutes(hours.start); m < toMinutes(hours.end); m += SLOT_MINUTES) {
    if (m >= earliest) slots.push(formatTime(m));
  }
  return slots;
}

/** 0 = Sunday, in Pacific time */
export const pacificWeekday = (now = new Date()) => pacificClock(now).weekday;

/** Is the spot open right now (Pacific)? */
export function openNow(spot: Spot, now = new Date()) {
  if (spot.closedOn === pacificDate(0, now)) return false;
  const clock = pacificClock(now);
  const d = spot.hours[clock.weekday];
  return !!d?.open && clock.minutes >= toMinutes(d.start) && clock.minutes < toMinutes(d.end);
}

/**
 * Short Spanish summary for the website, grouping days with the same hours:
 * "Todos los días · 6:00 – 10:00 p.m." or "Mié–Dom · 6:00 – 10:00 p.m."
 */
export function hoursSummary(hours: WeekHours): string[] {
  const groups: { days: number[]; range: string }[] = [];
  for (const day of WEEK_ORDER) {
    const d = hours[day];
    if (!d?.open) continue;
    const range = formatRange(d);
    const last = groups[groups.length - 1];
    const prevDay = last?.days[last.days.length - 1];
    if (last && last.range === range && WEEK_ORDER.indexOf(prevDay) === WEEK_ORDER.indexOf(day) - 1) last.days.push(day);
    else groups.push({ days: [day], range });
  }
  if (groups.length === 0) return ["Horario por anunciar"];
  if (groups.length === 1 && groups[0].days.length === 7) return [`Todos los días · ${groups[0].range}`];
  return groups.map(({ days, range }) => {
    const label = days.length === 1 ? DIAS[days[0]] : days.length === 2 ? `${DIAS[days[0]]} y ${DIAS[days[1]]}` : `${DIAS[days[0]]}–${DIAS[days[days.length - 1]]}`;
    return `${label} · ${range}`;
  });
}

type Place = Pick<Spot, "name" | "city" | "address" | "lat" | "lng">;
/** Exact coordinates when the staff set them, otherwise the address */
const where = (p: Place) => (p.lat != null && p.lng != null ? `${p.lat},${p.lng}` : p.address || `${p.name}, ${p.city}`);

/** Directions in Google Maps (opens the app on phones) */
export function mapsUrl(spot: Place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(where(spot))}`;
}

/** Google Maps embed for one spot; needs no API key */
export function mapEmbedUrl(spot: Place) {
  return `https://www.google.com/maps?q=${encodeURIComponent(where(spot))}&z=16&output=embed`;
}

// Where the truck is (or will be next), for the "Ahora en…" banner and the order form

export const CLOSING_SOON_MINUTES = 30;

export type SpotStatus =
  | { state: "open"; spot: Spot; closesAt: string; minutesLeft: number; closingSoon: boolean }
  | { state: "later"; spot: Spot; opensAt: string; day: "hoy" | "mañana" | string }
  | { state: "none" };

/**
 * The spot open right now; if none, the next one to open in the coming week.
 * When two are open at once, the one listed first wins.
 */
export function truckStatus(spots: Spot[], now = new Date()): SpotStatus {
  const clock = pacificClock(now);
  const today = pacificDate(0, now);
  for (const spot of spots) {
    const d = spot.hours[clock.weekday];
    if (spot.closedOn !== today && d?.open && clock.minutes >= toMinutes(d.start) && clock.minutes < toMinutes(d.end)) {
      const minutesLeft = toMinutes(d.end) - clock.minutes;
      return { state: "open", spot, closesAt: formatTime(toMinutes(d.end)), minutesLeft, closingSoon: minutesLeft <= CLOSING_SOON_MINUTES };
    }
  }
  for (let offset = 0; offset < 7; offset++) {
    const weekday = (clock.weekday + offset) % 7;
    const date = pacificDate(offset, now);
    let best: { spot: Spot; start: number } | null = null;
    for (const spot of spots) {
      const d = spot.hours[weekday];
      if (!d?.open || spot.closedOn === date) continue;
      const start = toMinutes(d.start);
      if (offset === 0 && start <= clock.minutes) continue;
      if (!best || start < best.start) best = { spot, start };
    }
    if (best) {
      const day = offset === 0 ? "hoy" : offset === 1 ? "mañana" : `el ${DIAS_LARGOS[weekday]}`;
      return { state: "later", spot: best.spot, opensAt: formatTime(best.start), day };
    }
  }
  return { state: "none" };
}

const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/**
 * Pulls coordinates out of whatever the staff paste from Google Maps: an
 * embed <iframe>, a share/browser link (…/@37.96,-122.31,17z) or "37.96, -122.31".
 */
export function parseMapLink(text: string): { lat: number; lng: number } | null {
  const ok = (lat: number, lng: number) => (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null);
  const embed = text.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
  if (embed) return ok(Number(embed[2]), Number(embed[1]));
  const pin = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pin) return ok(Number(pin[1]), Number(pin[2]));
  const pair = text.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (pair) return ok(Number(pair[1]), Number(pair[2]));
  return null;
}
