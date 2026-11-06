import { NextRequest, NextResponse } from "next/server";
import { cleanEmail, cleanPhone } from "@/lib/business";
import { addressLine, milesText, type Address } from "@/lib/delivery";
import { quoteDelivery } from "@/lib/geo";
import { getDelivery } from "@/lib/delivery-store";
import { checkRewardCode, isFirstOrder, linkRewardCode, pointsFor } from "@/lib/rewards";
import { discountLabel, firstOrderCents, freeDrinkCents, POINTS_FOR_DRINK } from "@/lib/rewards-rules";
import { getMenu, getSpots } from "@/lib/catalog";
import { deliverySlots, pickupDays, pickupSlots, type PickupDay } from "@/lib/schedule";
import { quote, type Line } from "@/lib/pricing";
import { pickedSummary } from "@/lib/options";
import { supabaseAdmin } from "@/lib/supabase";
import { connectedAccountId, stripe } from "@/lib/stripe";
import { pacificDate } from "@/lib/time";

// Stripe's minimum; an abandoned checkout's order is cancelled when it expires
const CHECKOUT_EXPIRY_SECONDS = 30 * 60;

type Body = {
  name?: string;
  phone?: string;
  email?: string;
  type?: "pickup" | "delivery";
  address?: Partial<Address>;
  /** Gate code, where to leave it, etc. */
  instructions?: string;
  /** Emailed code for a free drink with points */
  rewardCode?: string;
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
  const rawPhone = body.phone?.trim().slice(0, 30) ?? "";
  // Saved as (510) 555-1234 so staff can call and customers group correctly
  const phone = cleanPhone(rawPhone);
  const notes = body.notes?.trim().slice(0, 500) || null;
  const email = cleanEmail(body.email ?? "");
  const delivering = body.type === "delivery";

  if (!name || !rawPhone) return bad("Agrega tu nombre y teléfono.");
  if (!phone) return bad("Escribe un teléfono de 10 números para poder avisarte de tu orden.");
  if (!email) return bad("Escribe tu correo para mandarte la confirmación.");
  if (!Array.isArray(body.lines) || body.lines.length === 0) return bad("Tu orden está vacía.");

  const [{ items: menu }, spots, delivery] = await Promise.all([getMenu(), getSpots(), getDelivery()]);
  const day = pickupDays.find((d) => d === body.day) as PickupDay | undefined;
  if (!day) return bad("Elige una hora.");
  // A few minutes less lead time than the form, so a time picked just before it rolls over still works
  const lead = 5 + (delivering ? delivery.extraMinutes : 0);
  // Deliveries leave from wherever the truck is parked at that time
  const spot = delivering ? deliverySlots(spots, day, lead).find((s) => s.time === body.time)?.spot : spots.find((l) => l.name === body.location);
  if (!spot) return bad(delivering ? "Esa hora de entrega ya no está disponible. Elige otra." : "Elige una ubicación.");
  if (!delivering && !pickupSlots(spot, day, lead).includes(body.time ?? "")) return bad("Esa hora de pickup ya no está disponible. Elige otra.");

  let address: string | null = null;
  let deliveryFee = 0;
  let miles = 0;
  if (delivering) {
    if (!delivery.on) return bad("Por ahora solo tenemos pickup en el truck.");
    const a = { street: "", unit: "", city: "", zip: "", ...body.address };
    const clean = { street: String(a.street).trim().slice(0, 120), unit: String(a.unit).trim().slice(0, 20), city: String(a.city).trim().slice(0, 60), zip: String(a.zip).trim() };
    const dq = await quoteDelivery(clean, spot, delivery);
    if ("error" in dq) return bad(dq.error);
    address = addressLine(clean);
    deliveryFee = dq.feeCents;
    miles = dq.miles;
  }

  // Prices, fees and the total all come from the server's menu, never the browser
  const lines = body.lines.map((l) => ({ id: String(l.id), qty: Number(l.qty), options: Array.isArray(l.options) ? l.options.map(String) : [] }));
  let q;
  try {
    q = quote(lines, menu, { deliveryFee });
  } catch (e) {
    // Option problems explain themselves ("…demasiadas opciones en toppings")
    const msg = e instanceof Error && !e.message.startsWith("Unknown") && !e.message.startsWith("Bad") ? e.message : "";
    return bad(msg || "Algo en tu orden cambió. Revisa tu orden e intenta otra vez.");
  }

  if (delivering && q.subtotal < delivery.minCents) return bad(`El mínimo para entrega es $${(delivery.minCents / 100).toFixed(2)} en comida y bebidas.`);

  const account = await connectedAccountId();
  if (!account) return bad("Los pedidos en línea todavía no están activos.", 503);

  // A free drink: enough points, a drink in the order, and the emailed code (used up here)
  let rewardId: string | null = null;
  if (body.rewardCode) {
    if (freeDrinkCents(q.lines) === 0) return bad("Agrega una bebida para usar tu bebida gratis.");
    if ((await pointsFor(phone)).points < POINTS_FOR_DRINK) return bad(`Necesitas ${POINTS_FOR_DRINK} puntos para una bebida gratis.`);
    const used = await checkRewardCode(phone, String(body.rewardCode), true);
    if ("error" in used) return bad(used.error);
    rewardId = used.id;
    q = quote(lines, menu, { deliveryFee, discount: freeDrinkCents });
  } else if (await isFirstOrder(phone, email).catch(() => false)) {
    q = quote(lines, menu, { deliveryFee, discount: firstOrderCents });
  }

  const discountName = q.discount ? discountLabel(rewardId ? POINTS_FOR_DRINK : 0, q.lines) : null;
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .insert({
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      notes,
      fulfillment_type: delivering ? "delivery" : "pickup",
      delivery_address: address,
      delivery_instructions: delivering ? body.instructions?.trim().slice(0, 200) || null : null,
      delivery_fee_cents: q.deliveryFee,
      discount_cents: q.discount,
      discount_label: discountName,
      points_redeemed: rewardId ? POINTS_FOR_DRINK : 0,
      location: spot.name,
      pickup_day: day,
      pickup_time: body.time,
      pickup_date: pacificDate(day === "Mañana" ? 1 : 0),
      item_count: q.items,
      subtotal_cents: q.subtotal,
      platform_fee_cents: q.platformFee,
      card_fee_cents: q.cardFee,
      total_cents: q.total,
      stripe_account_id: account,
    })
    .select("id")
    .single();
  if (error || !order) {
    console.error("[checkout] order insert failed", error?.message);
    return bad("No pudimos guardar tu orden. Intenta otra vez.", 500);
  }
  if (rewardId) await linkRewardCode(rewardId, order.id);

  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
    q.lines.map(({ item, qty, unit, picked }) => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      price_cents: unit,
      quantity: qty,
      options: picked,
    })),
  );
  if (itemsError) return bad("No pudimos guardar tu orden. Intenta otra vez.", 500);

  const origin = new URL(req.url).origin;
  const fee = (name: string, cents: number) => ({ quantity: 1, price_data: { currency: "usd", unit_amount: cents, product_data: { name } } });

  // Stripe has no negative lines, so a discount is a one-time coupon on R&X's account
  const coupon = discountName
    ? await stripe.coupons.create({ amount_off: q.discount, currency: "usd", duration: "once", max_redemptions: 1, name: discountName }, { stripeAccount: account })
    : null;

  // Direct charge on R&X's account: Stripe takes its fee there (covered by the
  // card fee line) and sends the $1/item platform fee to us.
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      locale: "es",
      // The card fee line is priced for Stripe's card rate; Klarna, bank and
      // the rest cost more. Apple Pay and Google Pay are cards, so they stay.
      payment_method_types: ["card"],
      // Link's wallet also offers bank and Klarna payments with other fees
      wallet_options: { link: { display: "never" } },
      line_items: [
        ...q.lines.map(({ item, qty, unit, picked }) => ({
          quantity: qty,
          price_data: { currency: "usd", unit_amount: unit, product_data: { name: item.name, description: pickedSummary(picked) || item.desc || undefined } },
        })),
        ...(q.deliveryFee ? [fee(`Entrega a domicilio (${milesText(miles)})`, q.deliveryFee)] : []),
        fee(`Tarifa de servicio ($1 × ${q.items})`, q.platformFee),
        fee("Procesamiento de tarjeta", q.cardFee),
      ],
      ...(coupon ? { discounts: [{ coupon: coupon.id }] } : {}),
      customer_email: email,
      payment_intent_data: {
        application_fee_amount: q.platformFee,
        description: `Pedido R&X · ${delivering ? `Entrega ${milesText(miles)} desde ${spot.name} · ${address}` : spot.name} · ${day} ${body.time}`,
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
