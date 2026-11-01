"use client";

import Link from "next/link";
import { useState } from "react";
import { money } from "@/lib/data";
import { pickupDays, pickupSlots, truckStatus, type PickupDay, type Spot } from "@/lib/schedule";
import { statusLine, useNow } from "@/components/TruckNow";
import { PLATFORM_FEE_PER_ITEM, quote } from "@/lib/pricing";
import { useCart } from "@/lib/cart";
import { Heading, PageTop, Photo } from "@/components/ui";
import { AppleIcon, CalendarIcon, ClockIcon, LockIcon, TrashIcon } from "@/components/icons";

const input = "w-full rounded-xl border border-line bg-white px-4 py-2.5 placeholder:text-ink-soft/50 focus:outline-none focus:border-rose";

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white/70 border border-line p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-hand text-3xl">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Label({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return <span className="mb-1 flex items-center gap-1.5 text-sm text-ink-soft">{icon}{children}</span>;
}

export default function OrderForm({ spots }: { spots: Spot[] }) {
  const cart = useCart();
  const [spotName, setSpotName] = useState<string | null>(null);
  const [chosenDay, setDay] = useState<PickupDay | null>(null);
  const [chosenTime, setTime] = useState("");
  // Pickup times depend on the clock, so they're worked out in the browser and kept fresh
  const now = useNow();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Starts on wherever the truck is now (or is headed next) until the customer picks one
  const truck = now ? truckStatus(spots, now) : null;
  const spot = spots.find((s) => s.name === spotName) ?? (truck && truck.state !== "none" ? truck.spot : spots[0]);
  const spotNow = now && spot ? truckStatus([spot], now) : null;
  const slotsFor = (d: PickupDay) => (spot && now ? pickupSlots(spot, d, 15, now) : []);
  // Today if there's still time, otherwise tomorrow; a past time moves to the next one
  const day = chosenDay && slotsFor(chosenDay).length > 0 ? chosenDay : (pickupDays.find((d) => slotsFor(d).length > 0) ?? "Hoy");
  const slots = slotsFor(day);
  const time = slots.includes(chosenTime) ? chosenTime : (slots[0] ?? "");

  // Cents, priced from menu ids the same way the server will charge them
  const q = quote(cart.lines.map(({ id, qty, options }) => ({ id, qty, options })), cart.menu);
  const ready = cart.count > 0 && name.trim() !== "" && phone.trim() !== "" && !!spot && time !== "";

  // The server re-prices the order, saves it and hands back a Stripe Checkout link
  const pay = async () => {
    if (!ready || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, notes, location: spot?.name, day, time, lines: cart.lines.map(({ id, qty, options }) => ({ id, qty, options })) }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "No pudimos iniciar el pago. Intenta otra vez.");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar el pago. Intenta otra vez.");
      setSending(false);
    }
  };

  return (
    <PageTop>
      <div className="text-center">
        <Heading as="h1" sub="Revisa tu orden y completa tu compra.">
          Tu Pedido
        </Heading>
      </div>

      <div className="mt-10 grid lg:grid-cols-[1.1fr_1fr_0.95fr] gap-6 items-start">
        {/* Items */}
        <Panel
          title={`Tu Orden (${cart.count})`}
          action={
            <Link href="/menu" className="text-sm text-rose underline">
              Editar
            </Link>
          }
        >
          {cart.lines.length === 0 ? (
            <p className="py-6 text-center text-ink-soft">Tu orden está vacía.</p>
          ) : (
            <ul className="divide-y divide-line">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex gap-4 py-4 first:pt-0">
                  <Photo src={l.image} alt={l.name} className="w-20 h-20 rounded-2xl shrink-0" sizes="80px" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold leading-tight">{l.name}</p>
                      <span className="font-semibold text-rose">{money(l.price * l.qty)}</span>
                    </div>
                    <p className="text-sm text-ink-soft">{l.summary || l.desc}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-line bg-white">
                        <button onClick={() => cart.setQty(l.key, l.qty - 1)} aria-label="Quitar uno" className="w-8 h-8 text-lg">
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                        <button onClick={() => cart.setQty(l.key, l.qty + 1)} aria-label="Agregar uno" className="w-8 h-8 text-lg">
                          +
                        </button>
                      </div>
                      <button onClick={() => cart.setQty(l.key, 0)} aria-label={`Eliminar ${l.name}`} className="text-rose hover:text-rose-dark">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link href="/menu" className="mt-4 inline-flex rounded-full bg-rose hover:bg-rose-dark text-white text-sm font-semibold px-5 py-2.5">
            + Agregar más items
          </Link>
        </Panel>

        {/* Pickup info */}
        <Panel title="Entrega o pickup">
          <p className="rounded-xl bg-blush border border-rose text-rose text-center text-sm font-semibold py-2.5">Pickup en el truck</p>

          <div className="mt-4 space-y-3">
            <label className="block">
              <Label>Ubicación</Label>
              <select value={spot?.name ?? ""} onChange={(e) => setSpotName(e.target.value)} className={input}>
                {spots.map((l) => (
                  <option key={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
            {spotNow && spotNow.state !== "none" && (
              <p
                role="status"
                className={`rounded-xl border px-3 py-2 text-sm ${
                  spotNow.state === "open" && !spotNow.closingSoon
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : spotNow.state === "open"
                      ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                      : "bg-blush border-rose/30 text-ink"
                }`}
              >
                {spotNow.state === "later" && spotNow.spot.name === spot?.name ? "Aún no abrimos aquí. " : ""}
                {statusLine(spotNow)}
                {spotNow.state === "later" && day === "Hoy" ? " Tu orden estará lista a la hora que elijas." : ""}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <Label icon={<CalendarIcon className="w-4 h-4" />}>Fecha</Label>
                <select value={day} onChange={(e) => setDay(e.target.value as PickupDay)} className={input}>
                  {pickupDays.map((d) => (
                    <option key={d} value={d} disabled={!!now && slotsFor(d).length === 0}>
                      {d}
                      {now && slotsFor(d).length === 0 ? " (cerrado)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <Label icon={<ClockIcon className="w-4 h-4" />}>Hora</Label>
                <select value={time} onChange={(e) => setTime(e.target.value)} disabled={slots.length === 0} className={`${input} disabled:opacity-60`}>
                  {slots.length === 0 && <option value="">{now ? "Cerrado" : "…"}</option>}
                  {slots.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" autoComplete="name" className={input} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono (10 números)" type="tel" autoComplete="tel-national" inputMode="tel" className={input} />
            <label className="block">
              <Label>Notas (opcional)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ej. sin whipped cream, extra nutella, etc."
                className={`${input} resize-none`}
              />
            </label>
          </div>
        </Panel>

        {/* Summary + payment */}
        <Panel title="Resumen">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{money(q.subtotal / 100)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>
                Tarifa de servicio
                <span className="block text-xs text-ink-soft">
                  {money(PLATFORM_FEE_PER_ITEM / 100)} × {q.items} {q.items === 1 ? "artículo" : "artículos"}
                </span>
              </dt>
              <dd>{money(q.platformFee / 100)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Procesamiento de tarjeta</dt>
              <dd>{money(q.cardFee / 100)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
              <dt>Total</dt>
              <dd className="text-rose">{money(q.total / 100)}</dd>
            </div>
          </dl>

          <button
            onClick={pay}
            disabled={!ready || sending}
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-rose hover:bg-rose-dark disabled:bg-line disabled:text-ink-soft text-white text-lg font-bold py-3.5 transition-colors"
          >
            {sending ? "Abriendo pago…" : <>Pagar {money(q.total / 100)} <LockIcon className="w-5 h-5" /></>}
          </button>
          {error ? (
            <p role="alert" className="mt-2 text-center text-sm text-rose-dark">{error}</p>
          ) : !ready ? (
            <p className="mt-2 text-center text-xs text-ink-soft">
              {cart.count === 0
                ? "Agrega algo a tu orden primero."
                : !spot || (now && time === "")
                  ? "No hay horarios de pickup disponibles hoy ni mañana en esta ubicación."
                  : "Agrega tu nombre y teléfono."}
            </p>
          ) : null}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
            Pago seguro con Stripe: tarjeta, <AppleIcon className="w-3 h-3" /> Pay o Google Pay
          </p>
        </Panel>
      </div>
    </PageTop>
  );
}
