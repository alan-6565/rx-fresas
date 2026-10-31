import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { items as menu } from "@/lib/data";
import { pacificDate, pacificDayStart, pacificHour } from "@/lib/time";

type Row = {
  created_at: string;
  customer_phone: string;
  fulfillment_status: string;
  pickup_date: string | null;
  subtotal_cents: number;
  order_items: { menu_item_id: string; name: string; quantity: number; price_cents: number }[];
};

// The dashboard's numbers. Sales are R&X's money only: menu prices, without the
// $1/item fee or the card fee the customer also paid.
export async function dashboardStats() {
  const today = pacificDate(0);
  const yesterday = pacificDate(-1);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("created_at, customer_phone, fulfillment_status, pickup_date, subtotal_cents, order_items(menu_item_id, name, quantity, price_cents)")
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw error;
  const rows = (data ?? []) as Row[];

  const todayStart = pacificDayStart(today);
  const yesterdayStart = pacificDayStart(yesterday);
  const placedToday = rows.filter((r) => r.created_at >= todayStart);
  const placedYesterday = rows.filter((r) => r.created_at >= yesterdayStart && r.created_at < todayStart);
  const sales = (list: Row[]) => list.reduce((n, r) => n + r.subtotal_cents, 0);

  const change = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

  // Customers are told apart by phone number (digits only)
  const visits = new Map<string, number>();
  for (const r of rows) {
    const phone = r.customer_phone.replace(/\D/g, "").slice(-10);
    if (phone) visits.set(phone, (visits.get(phone) ?? 0) + 1);
  }
  const returning = [...visits.values()].filter((n) => n > 1).length;

  const byHour = Array.from({ length: 15 }, (_, i) => ({ hour: i + 8, orders: 0 })); // 8 a.m. – 10 p.m.
  for (const r of placedToday) {
    const slot = byHour.find((b) => b.hour === pacificHour(r.created_at));
    if (slot) slot.orders++;
  }

  const top = new Map<string, { id: string; name: string; sold: number; cents: number }>();
  for (const r of placedToday) {
    for (const i of r.order_items) {
      const t = top.get(i.menu_item_id) ?? { id: i.menu_item_id, name: i.name, sold: 0, cents: 0 };
      t.sold += i.quantity;
      t.cents += i.price_cents * i.quantity;
      top.set(i.menu_item_id, t);
    }
  }
  const topItems = [...top.values()]
    .sort((a, b) => b.sold - a.sold || b.cents - a.cents)
    .slice(0, 4)
    .map((t) => ({ ...t, image: menu.find((m) => m.id === t.id)?.image ?? "/images/logo.png" }));

  return {
    ordersToday: placedToday.length,
    ordersChange: change(placedToday.length, placedYesterday.length),
    salesToday: sales(placedToday),
    salesChange: change(sales(placedToday), sales(placedYesterday)),
    pending: rows.filter((r) => r.pickup_date === today && ["new", "preparing", "ready"].includes(r.fulfillment_status)).length,
    returning,
    customers: visits.size,
    byHour,
    topItems,
  };
}
