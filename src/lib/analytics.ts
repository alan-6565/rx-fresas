import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { pacificDate, pacificDayStart, pacificHour, TIME_ZONE } from "@/lib/time";

// Dashboard → Analytics. Paid orders only; sales are R&X's part (menu prices,
// without the service and card fees the customer also paid).

export const RANGES = { "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days", "365": "Last 12 months" } as const;
export type Range = keyof typeof RANGES;

type Row = {
  created_at: string;
  ready_at: string | null;
  customer_phone: string;
  subtotal_cents: number;
  item_count: number;
  location: string;
  order_items: { name: string; quantity: number; price_cents: number }[];
};

const weekday = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short" }).format(new Date(iso));
const dayOf = (iso: string) => pacificDate(0, new Date(iso));

export async function analytics(range: Range) {
  const days = Number(range);
  const start = pacificDate(-(days - 1));
  const prevStart = pacificDate(-(days * 2 - 1));

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("created_at, ready_at, customer_phone, subtotal_cents, item_count, location, order_items(name, quantity, price_cents)")
    .eq("payment_status", "paid")
    .gte("created_at", pacificDayStart(prevStart))
    .order("created_at")
    .limit(20000);
  if (error) throw error;
  const all = (data ?? []) as Row[];
  const cut = pacificDayStart(start);
  const rows = all.filter((r) => r.created_at >= cut);
  const prev = all.filter((r) => r.created_at < cut);

  const sum = (list: Row[]) => list.reduce((n, r) => n + r.subtotal_cents, 0);
  const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);
  const sales = sum(rows);
  const items = rows.reduce((n, r) => n + r.item_count, 0);

  // Per day (or per month for the 12-month view), with empty days kept
  const monthly = days > 90;
  const buckets = new Map<string, { label: string; cents: number; orders: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = pacificDate(-i);
    const key = monthly ? d.slice(0, 7) : d;
    if (!buckets.has(key)) {
      const at = new Date(`${d}T12:00:00Z`);
      buckets.set(key, {
        label: monthly ? at.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }) : at.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "UTC" }),
        cents: 0,
        orders: 0,
      });
    }
  }
  for (const r of rows) {
    const d = dayOf(r.created_at);
    const b = buckets.get(monthly ? d.slice(0, 7) : d);
    if (b) {
      b.cents += r.subtotal_cents;
      b.orders++;
    }
  }

  const hours = Array.from({ length: 15 }, (_, i) => ({ label: `${((i + 8 + 11) % 12) + 1}${i + 8 < 12 ? "a" : "p"}`, hour: i + 8, orders: 0 }));
  for (const r of rows) {
    const h = hours.find((x) => x.hour === pacificHour(r.created_at));
    if (h) h.orders++;
  }
  const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => ({ label, orders: 0, cents: 0 }));
  for (const r of rows) {
    const w = week.find((x) => x.label === weekday(r.created_at));
    if (w) {
      w.orders++;
      w.cents += r.subtotal_cents;
    }
  }

  const top = new Map<string, { name: string; sold: number; cents: number }>();
  for (const r of rows)
    for (const i of r.order_items) {
      const t = top.get(i.name) ?? { name: i.name, sold: 0, cents: 0 };
      t.sold += i.quantity;
      t.cents += i.price_cents * i.quantity;
      top.set(i.name, t);
    }

  const spots = new Map<string, { name: string; orders: number; cents: number }>();
  for (const r of rows) {
    const s = spots.get(r.location) ?? { name: r.location, orders: 0, cents: 0 };
    s.orders++;
    s.cents += r.subtotal_cents;
    spots.set(r.location, s);
  }

  // Customers in this period who had also ordered before it started
  const phone = (r: Row) => r.customer_phone.replace(/\D/g, "").slice(-10);
  const { data: earlier } = await supabaseAdmin.from("orders").select("customer_phone").eq("payment_status", "paid").lt("created_at", cut).limit(20000);
  const seenBefore = new Set((earlier ?? []).map((r) => r.customer_phone.replace(/\D/g, "").slice(-10)));
  const people = new Set(rows.map(phone).filter(Boolean));
  const returning = [...people].filter((p) => seenBefore.has(p) || rows.filter((r) => phone(r) === p).length > 1).length;

  const prepped = rows.filter((r) => r.ready_at).map((r) => (new Date(r.ready_at!).getTime() - new Date(r.created_at).getTime()) / 60000).filter((m) => m > 0 && m < 240);

  return {
    sales,
    salesChange: change(sales, sum(prev)),
    orders: rows.length,
    ordersChange: change(rows.length, prev.length),
    average: rows.length ? Math.round(sales / rows.length) : 0,
    items,
    customers: people.size,
    returning,
    prepMinutes: prepped.length ? Math.round(prepped.reduce((a, b) => a + b, 0) / prepped.length) : null,
    series: [...buckets.values()],
    monthly,
    hours,
    week,
    top: [...top.values()].sort((a, b) => b.sold - a.sold || b.cents - a.cents).slice(0, 8),
    spots: [...spots.values()].sort((a, b) => b.orders - a.orders),
  };
}
