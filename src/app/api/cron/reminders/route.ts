import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { notifyStaff } from "@/lib/push";
import { orderSummary } from "@/lib/orders";
import { sendStaffOrderAlert } from "@/lib/email";

// Supabase calls this every 30 seconds (pg_cron + pg_net). Each paid order
// nobody has accepted yet gets another banner, for up to 20 minutes, and
// another email to R&X, for up to 15.
const FIRST_REMINDER_SECONDS = 25;
const STOP_AFTER_MINUTES = 20;
const STOP_EMAILS_AFTER_MINUTES = 15;

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(req: Request) {
  if (!authorized(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, paid_at, customer_name, item_count, subtotal_cents, pickup_time, location")
    .eq("payment_status", "paid")
    .eq("fulfillment_status", "new")
    .lte("paid_at", new Date(now - FIRST_REMINDER_SECONDS * 1000).toISOString())
    .gte("paid_at", new Date(now - STOP_AFTER_MINUTES * 60 * 1000).toISOString())
    .order("paid_at");
  if (error) {
    console.error("[reminders]", error.message);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }

  let emailing = true;
  for (const o of orders ?? []) {
    const ms = now - new Date(o.paid_at).getTime();
    const seconds = Math.round(ms / 30_000) * 30;
    const waited = seconds < 60 ? `${seconds} sec` : `${Math.floor(seconds / 60)}${seconds % 60 ? "½" : ""} min`;
    await notifyStaff({
      title: `⏰ Order #${o.order_number} still waiting · ${waited}`,
      body: orderSummary(o),
      url: "/admin/orders",
      tag: `order-${o.order_number}`,
    });
    // If Gmail refuses one, don't keep trying the rest this round
    if (emailing && ms <= STOP_EMAILS_AFTER_MINUTES * 60_000) {
      await sendStaffOrderAlert(o.id, waited).catch((e) => {
        emailing = false;
        console.error("[email] reminder failed", e);
      });
    }
  }
  return Response.json({ reminded: orders?.length ?? 0 });
}
