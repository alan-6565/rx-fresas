import "server-only";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { notifyStaff } from "@/lib/push";

/**
 * The one place an order becomes paid: the webhook and the confirmation page
 * both call it, and only the call that flips it gets `true` back.
 */
export async function markOrderPaid(orderId: string, paymentIntentId?: string | null, email?: string | null): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
      ...(email ? { customer_email: email } : {}),
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("order_number, customer_name, item_count, subtotal_cents, pickup_time, location");
  if (error) throw error;

  const order = data?.[0];
  if (!order) return false;

  // Only the call that flipped it to paid alerts the truck, so nobody gets it twice
  after(() =>
    notifyStaff({
      title: `New order #${order.order_number}`,
      body: orderSummary(order),
      url: "/admin/orders",
      tag: `order-${order.order_number}`,
    }),
  );
  return true;
}

type SummaryFields = { customer_name: string; item_count: number; subtotal_cents: number; pickup_time: string; location: string };

export function orderSummary(o: SummaryFields) {
  return `${o.customer_name} · ${o.item_count} item${o.item_count === 1 ? "" : "s"} · $${(o.subtotal_cents / 100).toFixed(2)} · ${o.pickup_time} at ${o.location}`;
}

export async function cancelUnpaidOrder(orderId: string) {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ payment_status: "cancelled", fulfillment_status: "cancelled" })
    .eq("id", orderId)
    .eq("payment_status", "pending");
  if (error) throw error;
}
