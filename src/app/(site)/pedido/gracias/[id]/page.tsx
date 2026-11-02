import Link from "next/link";
import { notFound } from "next/navigation";
import { money } from "@/lib/data";
import { pickedSummary, type Picked } from "@/lib/options";
import { supabaseAdmin } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { pointsFor } from "@/lib/rewards";
import { POINTS_FOR_DRINK, POINTS_PER_ORDER } from "@/lib/rewards-rules";
import { HeartSolid, StarIcon } from "@/components/icons";
import { ClearCart } from "./ClearCart";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  fulfillment_type: "pickup" | "delivery";
  delivery_address: string | null;
  delivery_fee_cents: number;
  discount_cents: number;
  order_number: number | null;
  location: string;
  pickup_day: string;
  pickup_time: string;
  payment_status: string;
  subtotal_cents: number;
  platform_fee_cents: number;
  card_fee_cents: number;
  total_cents: number;
  stripe_account_id: string;
  stripe_session_id: string | null;
  order_items: { name: string; quantity: number; price_cents: number; options: Picked[] | null }[];
};

export default async function ThanksPage({ params }: PageProps<"/pedido/gracias/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const { data } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(name, quantity, price_cents, options)")
    .eq("id", id)
    .maybeSingle();
  const order = data as Order | null;
  if (!order) notFound();

  // Don't wait on the webhook: ask Stripe directly whether this order was paid
  let paid = order.payment_status === "paid";
  if (!paid && order.payment_status === "pending" && order.stripe_session_id) {
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {}, { stripeAccount: order.stripe_account_id });
    if (session.payment_status === "paid") {
      const intent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      await markOrderPaid(order.id, intent, session.customer_details?.email);
      paid = true;
    }
  }

  if (!paid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-hand text-5xl">Tu pago no se completó</h1>
        <p className="mt-4 text-ink-soft">No se hizo ningún cargo. Puedes volver a intentarlo cuando quieras.</p>
        <Link href="/pedido" className="mt-8 inline-flex rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-8 py-3">
          Volver a mi pedido
        </Link>
      </div>
    );
  }

  const firstName = order.customer_name.split(" ")[0];
  const delivery = order.fulfillment_type === "delivery";
  const points = await pointsFor(order.customer_phone)
    .then((p) => p.points)
    .catch(() => null);
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <ClearCart />
      <span className="mx-auto grid place-items-center w-20 h-20 rounded-full bg-rose text-white shadow-lg">
        <HeartSolid className="w-10 h-10" />
      </span>
      <h1 className="mt-6 font-hand text-6xl">¡Gracias, {firstName}!</h1>
      <p className="mt-4 text-lg">
        {delivery ? (
          <>
            Llevamos tu pedido a <strong>{order.delivery_address}</strong> {order.pickup_day.toLowerCase()} a las <strong>{order.pickup_time}</strong>.
          </>
        ) : (
          <>
            Tu pedido estará listo <strong>{order.pickup_day.toLowerCase()} a las {order.pickup_time}</strong> en <strong>{order.location}</strong>.
          </>
        )}
      </p>
      {order.customer_email && (
        <p className="mt-2 text-ink-soft">
          Te mandamos la confirmación a <strong>{order.customer_email}</strong>
          {delivery ? " y te avisamos cuando vaya en camino." : " y te avisamos cuando esté listo."}
        </p>
      )}

      {points !== null && (
        <div className="mt-8 rounded-3xl border border-rose/30 bg-blush/60 p-5 text-left">
          <p className="flex items-center gap-2 font-bold">
            <StarIcon className="w-5 h-5 text-rose" /> +{POINTS_PER_ORDER} puntos R&amp;X
          </p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-gradient-to-r from-rose to-wine" style={{ width: `${Math.min(100, (points / POINTS_FOR_DRINK) * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            {points >= POINTS_FOR_DRINK
              ? "¡Ya tienes una bebida gratis! Úsala en tu próximo pedido en línea."
              : `Llevas ${points} de ${POINTS_FOR_DRINK}. Te faltan ${POINTS_FOR_DRINK - points} para una bebida gratis.`}
          </p>
        </div>
      )}

      <div className="mt-8 rounded-3xl bg-white border border-line p-5 text-left">
        <ul className="space-y-1.5 text-sm">
          {order.order_items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4">
              <span>
                {i.quantity} × {i.name}
                {i.options?.length ? <span className="block text-xs text-ink-soft">{pickedSummary(i.options)}</span> : null}
              </span>
              <span>{money((i.price_cents * i.quantity) / 100)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 pt-3 border-t border-line space-y-1 text-sm text-ink-soft">
          {order.discount_cents > 0 && (
            <div className="flex justify-between font-semibold text-wine">
              <dt>Bebida gratis ⭐</dt>
              <dd>−{money(order.discount_cents / 100)}</dd>
            </div>
          )}
          {order.delivery_fee_cents > 0 && (
            <div className="flex justify-between">
              <dt>Entrega</dt>
              <dd>{money(order.delivery_fee_cents / 100)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Tarifa de servicio</dt>
            <dd>{money((order.platform_fee_cents + order.card_fee_cents) / 100)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold text-ink">
            <dt>Total pagado</dt>
            <dd className="text-rose">{money(order.total_cents / 100)}</dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-xs text-ink-soft">Orden #{order.order_number ?? order.id.slice(0, 8).toUpperCase()}</p>

      <Link href="/menu" className="mt-8 inline-flex rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-8 py-3">
        Volver al Menú
      </Link>
    </div>
  );
}
