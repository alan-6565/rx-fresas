import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

// Customers come from paid orders, told apart by phone number (last 10 digits).
// Spending is R&X's part only: menu prices, without the service and card fees.

export type CustomerOrder = { id: string; number: number | null; at: string; cents: number; refunded: boolean; items: string; location: string };

export type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string;
  orders: number;
  spentCents: number;
  first: string;
  last: string;
  favorite: string;
  history: CustomerOrder[];
};

type Row = {
  id: string;
  order_number: number | null;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  subtotal_cents: number;
  payment_status: string;
  location: string;
  order_items: { name: string; quantity: number }[];
};

/** `asOf`: when the list was read, for "new" and "missing you" */
export async function getCustomers(): Promise<{ customers: Customer[]; asOf: number }> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, created_at, customer_name, customer_phone, customer_email, subtotal_cents, payment_status, location, order_items(name, quantity)")
    .in("payment_status", ["paid", "refunded"])
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error) throw error;

  const byKey = new Map<string, { rows: Row[] }>();
  for (const r of (data ?? []) as Row[]) {
    const key = r.customer_phone.replace(/\D/g, "").slice(-10) || r.customer_name.trim().toLowerCase();
    if (!key) continue;
    const c = byKey.get(key) ?? { rows: [] };
    c.rows.push(r);
    byKey.set(key, c);
  }

  const customers = [...byKey.entries()].map(([key, { rows }]) => {
    const paid = rows.filter((r) => r.payment_status === "paid");
    const counts = new Map<string, number>();
    for (const r of paid) for (const i of r.order_items) counts.set(i.name, (counts.get(i.name) ?? 0) + i.quantity);
    const favorite = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    const newest = rows[0];
    return {
      key,
      name: newest.customer_name,
      phone: newest.customer_phone,
      email: rows.find((r) => r.customer_email)?.customer_email ?? "",
      orders: paid.length,
      spentCents: paid.reduce((n, r) => n + r.subtotal_cents, 0),
      first: rows[rows.length - 1].created_at,
      last: newest.created_at,
      favorite,
      history: rows.slice(0, 25).map((r) => ({
        id: r.id,
        number: r.order_number,
        at: r.created_at,
        cents: r.subtotal_cents,
        refunded: r.payment_status === "refunded",
        items: r.order_items.map((i) => `${i.quantity > 1 ? `${i.quantity}× ` : ""}${i.name}`).join(", "),
        location: r.location,
      })),
    };
  });
  // Someone whose only order was refunded isn't a customer yet
  return { customers: customers.filter((c) => c.orders > 0), asOf: Date.now() };
}
