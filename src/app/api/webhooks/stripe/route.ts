import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { cancelUnpaidOrder, markOrderPaid } from "@/lib/orders";

// A Connect webhook: events come from R&X's connected account. The thank-you
// page also confirms payment, so this is the backup for customers who close
// the tab before it loads.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      try {
        if (event.type === "checkout.session.expired") await cancelUnpaidOrder(orderId);
        else if (session.payment_status === "paid") {
          const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
          await markOrderPaid(orderId, intent, session.customer_details?.email);
        }
      } catch {
        return NextResponse.json({ error: "Could not update order" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
