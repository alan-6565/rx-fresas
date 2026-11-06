import { after, NextRequest, NextResponse } from "next/server";
import { sendOrderDelivered, sendOrderReady } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

type Status = "new" | "preparing" | "ready" | "out_for_delivery" | "picked_up" | "delivered" | "cancelled";

// Where each status can go next. Back-steps are there for mis-taps.
const PICKUP: Partial<Record<Status, Status[]>> = {
  new: ["preparing", "cancelled"],
  preparing: ["ready", "new", "cancelled"],
  ready: ["picked_up", "preparing", "cancelled"],
  picked_up: ["ready"],
};
const DELIVERY: Partial<Record<Status, Status[]>> = {
  new: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "new", "cancelled"],
  out_for_delivery: ["delivered", "preparing", "cancelled"],
  delivered: ["out_for_delivery"],
};
const ALL_STATUSES = ["new", "preparing", "ready", "out_for_delivery", "picked_up", "delivered", "cancelled"];

const STAMP: Partial<Record<Status, string>> = {
  preparing: "accepted_at",
  ready: "ready_at",
  out_for_delivery: "ready_at",
  picked_up: "picked_up_at",
  delivered: "picked_up_at",
  cancelled: "cancelled_at",
};

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/admin/orders/[id]">) {
  const { id } = await params;
  const { status, photoUrl } = (await req.json().catch(() => ({}))) as { status?: Status; photoUrl?: string };
  if (!status || !ALL_STATUSES.includes(status)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status, fulfillment_status, fulfillment_type, stripe_account_id, stripe_payment_intent_id")
    .eq("id", id)
    .maybeSingle();
  if (!order || order.payment_status !== "paid") return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const from = order.fulfillment_status as Status;
  const steps = order.fulfillment_type === "delivery" ? DELIVERY : PICKUP;
  if (!steps[from]?.includes(status)) return NextResponse.json({ error: `Can't go from ${from} to ${status}` }, { status: 409 });

  // A delivery only counts as done with a photo of it, from our own storage
  const photoPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/deliveries/`;
  if (status === "delivered" && !photoUrl?.startsWith(photoPrefix)) return NextResponse.json({ error: "Take a photo of the delivery first" }, { status: 400 });

  // Cancelling gives the customer all their money back, including the $1/item
  // fee. Stripe keeps its own processing fee, which comes out of R&X's balance.
  if (status === "cancelled") {
    if (!order.stripe_payment_intent_id) return NextResponse.json({ error: "No payment found to refund" }, { status: 409 });
    try {
      await stripe.refunds.create(
        { payment_intent: order.stripe_payment_intent_id, refund_application_fee: true, reason: "requested_by_customer" },
        { stripeAccount: order.stripe_account_id },
      );
    } catch (e) {
      return NextResponse.json({ error: `Refund failed: ${e instanceof Error ? e.message : "unknown"}` }, { status: 502 });
    }
  }

  const stamp = STAMP[status];
  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      fulfillment_status: status,
      ...(status === "cancelled" ? { payment_status: "refunded" } : {}),
      ...(stamp ? { [stamp]: new Date().toISOString() } : {}),
      ...(status === "delivered" ? { delivery_photo_url: photoUrl } : {}),
      ...(from === "delivered" ? { delivery_photo_url: null } : {}),
    })
    .eq("id", id)
    .eq("fulfillment_status", from);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // "Ready" (or "on its way" for delivery) emails the customer, once per order
  if (status === "ready" || status === "out_for_delivery") after(() => sendOrderReady(id).catch((e) => console.error("[email] ready failed", e)));
  if (status === "delivered") after(() => sendOrderDelivered(id).catch((e) => console.error("[email] delivered failed", e)));
  return NextResponse.json({ ok: true });
}
