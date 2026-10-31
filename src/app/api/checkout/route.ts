import { NextRequest, NextResponse } from "next/server";
import { items as menu, locations, pickupDays, pickupTimes } from "@/lib/data";
import { quote, type Line } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase";
import { connectedAccountId, stripe } from "@/lib/stripe";

// Stripe's minimum; an abandoned checkout's order is cancelled when it expires
const CHECKOUT_EXPIRY_SECONDS = 30 * 60;

type Body = {
  name?: string;
  phone?: string;
  notes?: string;
  location?: string;
  day?: string;
  time?: string;
  lines?: Line[];
};

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Body;
  const name = body.name?.trim().slice(0, 80) ?? "";
  const phone = body.phone?.trim().slice(0, 30) ?? "";
  const notes = body.notes?.trim().slice(0, 500) || null;

  if (!name || !phone) return bad("Agrega tu nombre y teléfono.");
  if (!locations.some((l) => l.name === body.location)) return bad("Elige una ubicación.");
  if (!pickupDays.includes(body.day ?? "") || !pickupTimes.includes(body.time ?? "")) return bad("Elige una fecha y hora.");
  if (!Array.isArray(body.lines) || body.lines.length === 0) return bad("Tu orden está vacía.");

  // Prices, fees and the total all come from the server's menu, never the browser
  let q;
  try {
    q = quote(body.lines.map((l) => ({ id: String(l.id), qty: Number(l.qty) })));
  } catch {
    return bad("Algo en tu orden cambió. Revisa tu orden e intenta otra vez.");
  }

  const account = await connectedAccountId();
  if (!account) return bad("Los pedidos en línea todavía no están activos.", 503);

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_name: name,
      customer_phone: phone,
      notes,
      location: body.location,
      pickup_day: body.day,
      pickup_time: body.time,
      item_count: q.items,
      subtotal_cents: q.subtotal,
      platform_fee_cents: q.platformFee,
      card_fee_cents: q.cardFee,
      total_cents: q.total,
      stripe_account_id: account,
    })
    .select("id")
    .single();
  if (error || !order) return bad("No pudimos guardar tu orden. Intenta otra vez.", 500);

  const lines = body.lines.map((l) => {
    const item = menu.find((m) => m.id === l.id)!;
    return { item, qty: Number(l.qty) };
  });
  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
    lines.map(({ item, qty }) => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      price_cents: Math.round(item.price * 100),
      quantity: qty,
    })),
  );
  if (itemsError) return bad("No pudimos guardar tu orden. Intenta otra vez.", 500);

  const origin = new URL(req.url).origin;
  const fee = (name: string, cents: number) => ({ quantity: 1, price_data: { currency: "usd", unit_amount: cents, product_data: { name } } });

  // Direct charge on R&X's account: Stripe takes its fee there (covered by the
  // card fee line) and sends the $1/item platform fee to us.
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      locale: "es",
      line_items: [
        ...lines.map(({ item, qty }) => ({
          quantity: qty,
          price_data: { currency: "usd", unit_amount: Math.round(item.price * 100), product_data: { name: item.name, description: item.desc } },
        })),
        fee(`Tarifa de servicio ($1 × ${q.items})`, q.platformFee),
        fee("Procesamiento de tarjeta", q.cardFee),
      ],
      payment_intent_data: {
        application_fee_amount: q.platformFee,
        description: `Pedido R&X · ${body.location} · ${body.day} ${body.time}`,
        metadata: { orderId: order.id },
      },
      metadata: { orderId: order.id },
      success_url: `${origin}/pedido/gracias/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pedido`,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_EXPIRY_SECONDS,
    },
    { stripeAccount: account },
  );

  // Stripe's total must match ours to the cent, or something is off
  if (session.amount_total !== q.total) {
    await stripe.checkout.sessions.expire(session.id, {}, { stripeAccount: account });
    return bad("No pudimos calcular tu total. Intenta otra vez.", 500);
  }

  await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
  return NextResponse.json({ url: session.url });
}
