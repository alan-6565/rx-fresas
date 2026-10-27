"use client";

import Link from "next/link";
import { useState } from "react";
import { business, locations, money } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { Heading, PageTop, Photo } from "@/components/ui";
import { AppleIcon, CalendarIcon, ClockIcon, HeartSolid, LockIcon, TrashIcon } from "@/components/icons";

// Truck hours are 6–10 p.m., so pickup slots every 15 minutes in that window
const TIMES = Array.from({ length: 16 }, (_, i) => {
  const mins = 18 * 60 + i * 15;
  return `${Math.floor(mins / 60) - 12}:${(mins % 60).toString().padStart(2, "0")} p.m.`;
});

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
  const [mode, setMode] = useState<"pickup" | "delivery">("pickup");
  const [spot, setSpot] = useState(locations[0].name);
  const [day, setDay] = useState("Hoy");
  const [time, setTime] = useState(TIMES[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [placed, setPlaced] = useState<null | { total: number; name: string; when: string }>(null);

  const fee = cart.count > 0 ? business.serviceFee : 0;
  const total = cart.subtotal + fee;
  const ready = cart.count > 0 && name.trim() !== "" && phone.trim() !== "";

  const pay = () => {
    if (!ready) return;
    setPlaced({ total, name: name.trim().split(" ")[0], when: `${day.toLowerCase()} a las ${time}` });
    cart.clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <span className="mx-auto grid place-items-center w-20 h-20 rounded-full bg-rose text-white shadow-lg">
          <HeartSolid className="w-10 h-10" />
        </span>
        <h1 className="mt-6 font-hand text-6xl">¡Gracias, {placed.name}!</h1>
        <p className="mt-4 text-lg">
          Tu pedido de <strong>{money(placed.total)}</strong> estará listo {placed.when} en <strong>{spot}</strong>.
        </p>
        <p className="mt-6 rounded-2xl border-2 border-dashed border-line px-4 py-3 text-sm text-ink-soft">
          Sitio de muestra: no se cobró nada y no se envió ningún pedido.
        </p>
        <Link href="/menu" className="mt-8 inline-flex rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-8 py-3">
          Volver al Menú
        </Link>
      </div>
    );
  }

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
          <div className="grid grid-cols-2 gap-2">
            {(["pickup", "delivery"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${mode === m ? "bg-blush border-rose text-rose" : "bg-white border-line"}`}
              >
                {m === "pickup" ? "Pickup" : "Delivery"}
                {m === "delivery" && <span className="block text-[10px] font-normal text-ink-soft">(si está disponible)</span>}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {mode === "pickup" ? (
              <label className="block">
                <Label>Ubicación</Label>
                <select value={spot} onChange={(e) => setSpot(e.target.value)} className={input}>
                  {locations.map((l) => (
                    <option key={l.name}>{l.name}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block">
                <Label>Dirección de entrega</Label>
                <input placeholder="Calle, ciudad" className={input} />
              </label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <Label icon={<CalendarIcon className="w-4 h-4" />}>Fecha</Label>
                <select value={day} onChange={(e) => setDay(e.target.value)} className={input}>
                  <option>Hoy</option>
                  <option>Mañana</option>
                </select>
              </label>
              <label className="block">
                <Label icon={<ClockIcon className="w-4 h-4" />}>Hora</Label>
                <select value={time} onChange={(e) => setTime(e.target.value)} className={input}>
                  {TIMES.map((t) => (
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
              <dd>{money(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Tarifa de servicio</dt>
              <dd>{money(fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold">
              <dt>Total</dt>
              <dd className="text-rose">{money(total)}</dd>
            </div>
          </dl>

          <button onClick={pay} disabled={!ready} className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-xl bg-black text-white font-semibold py-3 disabled:opacity-40">
            Comprar con <AppleIcon className="w-4 h-4 -mt-0.5" />Pay
          </button>
          <p className="my-3 text-center text-xs text-ink-soft">o pagar con tarjeta</p>

          <div className="space-y-3">
            <label className="block">
              <Label>Número de tarjeta</Label>
              <div className="relative">
                <input placeholder="1234 1234 1234 1234" inputMode="numeric" className={`${input} pr-28`} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 text-[9px] font-bold">
                  <span className="rounded bg-[#1a1f71] text-white px-1">VISA</span>
                  <span className="rounded bg-[#eb001b] text-white px-1">MC</span>
                  <span className="rounded bg-[#2e77bb] text-white px-1">AMEX</span>
                </span>
              </div>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <Label>Fecha de expiración</Label>
                <input placeholder="MM / AA" className={input} />
              </label>
              <label className="block">
                <Label>CVC</Label>
                <input placeholder="CVC" className={input} />
              </label>
            </div>
          </div>

          <button
            onClick={pay}
            disabled={!ready}
            className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-rose hover:bg-rose-dark disabled:bg-line disabled:text-ink-soft text-white text-lg font-bold py-3.5 transition-colors"
          >
            Pagar {money(total)} <LockIcon className="w-5 h-5" />
          </button>
          {!ready && (
            <p className="mt-2 text-center text-xs text-ink-soft">{cart.count === 0 ? "Agrega algo a tu orden primero." : "Agrega tu nombre y teléfono."}</p>
          )}
        </Panel>
      </div>
    </PageTop>
  );
}
