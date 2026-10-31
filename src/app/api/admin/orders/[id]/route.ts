import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";

type Status = "new" | "preparing" | "ready" | "picked_up" | "cancelled";

// Where each status can go next. Back-steps are there for mis-taps.
const NEXT: Record<Status, Status[]> = {
  new: ["preparing", "cancelled"],
  preparing: ["ready", "new", "cancelled"],
  ready: ["picked_up", "preparing", "cancelled"],
  picked_up: ["ready"],
  cancelled: [],
};

const STAMP: Partial<Record<Status, string>> = {
  preparing: "accepted_at",
  ready: "ready_at",
  picked_up: "picked_up_at",
  cancelled: "cancelled_at",
};

export async function PATCH(req: NextRequest, { params }: RouteContext<"/api/admin/orders/[id]">) {
  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: Status };
  if (!status || !(status in NEXT)) return NextResponse.json({ error: "Unknown status" }, { status: 400 });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status, fulfillment_status, stripe_account_id, stripe_payment_intent_id")
    .eq("id", id)
    .maybeSingle();
  if (!order || order.payment_status !== "paid") return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const from = order.fulfillment_status as Status;
  if (!NEXT[from].includes(status)) return NextResponse.json({ error: `Can't go from ${from} to ${status}` }, { status: 409 });

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
    })
    .eq("id", id)
    .eq("fulfillment_status", from);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
