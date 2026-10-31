import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * The one place an order becomes paid: the webhook and the confirmation page
 * both call it, and only the call that flips it gets `true` back.
 */
export async function markOrderPaid(orderId: string, paymentIntentId?: string | null, email?: string | null): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "paid",
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
      ...(email ? { customer_email: email } : {}),
    })
    .eq("id", orderId)
    .eq("payment_status", "pending")
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function cancelUnpaidOrder(orderId: string) {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({ payment_status: "cancelled", fulfillment_status: "cancelled" })
    .eq("id", orderId)
    .eq("payment_status", "pending");
  if (error) throw error;
}
