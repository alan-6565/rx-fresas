"use client";

import Link from "next/link";
import { useState } from "react";
import { locations, money, pickupDays, pickupTimes } from "@/lib/data";
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

export default function OrderPage() {
  const cart = useCart();
  const [spot, setSpot] = useState(locations[0].name);
  const [day, setDay] = useState(pickupDays[0]);
  const [time, setTime] = useState(pickupTimes[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Cents, priced from menu ids the same way the server will charge them
  const q = quote(cart.lines.map(({ id, qty }) => ({ id, qty })));
  const ready = cart.count > 0 && name.trim() !== "" && phone.trim() !== "";

  // The server re-prices the order, saves it and hands back a Stripe Checkout link
  const pay = async () => {
    if (!ready || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, notes, location: spot, day, time, lines: cart.lines.map(({ id, qty }) => ({ id, qty })) }),
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
                <li key={l.id} className="flex gap-4 py-4 first:pt-0">
                  <Photo src={l.image} alt={l.name} className="w-20 h-20 rounded-2xl shrink-0" sizes="80px" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="font-semibold leading-tight">{l.name}</p>
                      <span className="font-semibold text-rose">{money(l.price * l.qty)}</span>
                    </div>
                    <p className="text-sm text-ink-soft">{l.desc}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-line bg-white">
                        <button onClick={() => cart.setQty(l.id, l.qty - 1)} aria-label="Quitar uno" className="w-8 h-8 text-lg">
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{l.qty}</span>
                        <button onClick={() => cart.setQty(l.id, l.qty + 1)} aria-label="Agregar uno" className="w-8 h-8 text-lg">
                          +
                        </button>
                      </div>
                      <button onClick={() => cart.setQty(l.id, 0)} aria-label={`Eliminar ${l.name}`} className="text-rose hover:text-rose-dark">
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
              <select value={spot} onChange={(e) => setSpot(e.target.value)} className={input}>
                {locations.map((l) => (
                  <option key={l.name}>{l.name}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <Label icon={<CalendarIcon className="w-4 h-4" />}>Fecha</Label>
                <select value={day} onChange={(e) => setDay(e.target.value)} className={input}>
                  {pickupDays.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <Label icon={<ClockIcon className="w-4 h-4" />}>Hora</Label>
                <select value={time} onChange={(e) => setTime(e.target.value)} className={input}>
                  {pickupTimes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className={input} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono" type="tel" className={input} />
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
            <p className="mt-2 text-center text-xs text-ink-soft">{cart.count === 0 ? "Agrega algo a tu orden primero." : "Agrega tu nombre y teléfono."}</p>
          ) : null}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
            Pago seguro con Stripe: tarjeta, <AppleIcon className="w-3 h-3" /> Pay o Google Pay
          </p>
        </Panel>
      </div>
    </PageTop>
  );
}
