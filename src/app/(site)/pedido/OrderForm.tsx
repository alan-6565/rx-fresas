"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { money, NO_PHOTO } from "@/lib/data";
import { cleanEmail, cleanPhone } from "@/lib/business";
import { addressProblem, milesText, type Address, type DeliverySettings } from "@/lib/delivery";
import { deliverySlots, pacificMinutes, pickupDays, pickupSlots, slotMinutes, truckStatus, type PickupDay, type Spot } from "@/lib/schedule";
import { statusLine, useNow } from "@/components/TruckNow";
import { PLATFORM_FEE_PER_ITEM, quote } from "@/lib/pricing";
import { discountLabel, firstOrderCents, freeDrinkCents, POINTS_FOR_DRINK, POINTS_PER_ORDER } from "@/lib/rewards-rules";
import { useCart } from "@/lib/cart";
import { PageTop, Photo } from "@/components/ui";
import { AppleIcon, ArrowRightIcon, BagIcon, BoltIcon, CarIcon, ClockIcon, HeartDoodle, LockIcon, PinIcon, StarIcon, TrashIcon } from "@/components/icons";

// Checkout in two steps: 1) pickup or delivery, when, and who; 2) review,
// points, then Stripe. The order summary stays on the right the whole time.

const input = "w-full rounded-xl border border-line bg-white px-4 py-3 placeholder:text-ink-soft/50 focus:outline-none focus:border-wine";
const LEAD = 15;

/** `spot`: for delivery, where the truck is parked at that time */
type Choice = { day: PickupDay; time: string; spot?: string };
type DeliveryQuote = { miles: number; feeCents: number; label: string } | { error: string };
/** undefined while loading, null if it couldn't be checked */
type Rewards = { points: number; canRedeem: boolean } | null | undefined;

function Card({ icon, title, action, children, className = "" }: { icon?: React.ReactNode; title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`${className} rounded-[2rem] border border-white bg-white/80 p-5 shadow-[0_10px_40px_rgba(140,42,60,0.08)] backdrop-blur sm:p-7`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 font-hand text-3xl text-ink">
          {icon && <span className="text-wine">{icon}</span>}
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Label({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return <span className="mb-2 flex items-center gap-2 font-semibold text-ink">{icon}{children}</span>;
}

function StoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M3 9.5 4.5 4h15L21 9.5M3 9.5c0 1.4 1.1 2.5 2.5 2.5S8 10.9 8 9.5m-5 0h18M8 9.5c0 1.4 1.1 2.5 2.5 2.5S13 10.9 13 9.5m0 0c0 1.4 1.1 2.5 2.5 2.5S18 10.9 18 9.5m0 0c0 1.4 1.1 2.5 2.5 2.5M5 12v8h14v-8M10 20v-5h4v5" />
    </svg>
  );
}

const inMinutes = (n: number) => (n < 60 ? `en ${n} min` : `en ${Math.floor(n / 60)} h${n % 60 ? ` ${n % 60} min` : ""}`);

/** "Lo antes posible" plus every slot today and tomorrow, like the mockup's dropdown */
function TimePicker({ choices, value, asap, onChange, now }: { choices: Choice[]; value: Choice | null; asap: boolean; onChange: (c: Choice | null) => void; now: Date }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const mins = pacificMinutes(now);
  const rel = (c: Choice) => (c.day === "Hoy" ? inMinutes(slotMinutes(c.time) - mins) : "mañana");
  const first = choices[0];
  const pick = (c: Choice | null) => {
    onChange(c);
    setOpen(false);
  };
  const row = (selected: boolean) =>
    `flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-blush/60 ${selected ? "bg-blush/70 font-semibold" : ""}`;

  if (!first) return <p className="rounded-xl border border-line bg-white px-4 py-3 text-ink-soft">No hay horarios disponibles hoy ni mañana.</p>;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors ${open ? "border-wine" : "border-line hover:border-wine/60"}`}
      >
        {asap ? <BoltIcon className="w-5 h-5 text-wine" /> : <ClockIcon className="w-5 h-5 text-wine" />}
        <span className={`flex-1 ${asap ? "font-semibold text-wine" : ""}`}>
          {asap ? `Lo antes posible (${first.day === "Hoy" ? first.time : `mañana ${first.time}`})` : value ? `${value.day === "Mañana" ? "Mañana, " : ""}${value.time} — ${rel(value)}` : "Elige una hora"}
        </span>
        <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-white py-1 shadow-xl">
          <li>
            <button type="button" role="option" aria-selected={asap} onClick={() => pick(null)} className={row(asap)}>
              <BoltIcon className="w-4 h-4 text-wine" />
              <span className="flex-1 text-wine">Lo antes posible (ASAP)</span>
              {asap && <span className="text-wine">✓</span>}
            </button>
          </li>
          {choices.map((c, i) => {
            const selected = !asap && value?.day === c.day && value.time === c.time;
            return (
              <li key={`${c.day}${c.time}`}>
                {c.day === "Mañana" && choices[i - 1]?.day !== "Mañana" && <p className="border-t border-line px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-ink-soft">Mañana</p>}
                <button type="button" role="option" aria-selected={selected} onClick={() => pick(c)} className={row(selected)}>
                  <ClockIcon className="w-4 h-4 text-ink-soft" />
                  <span className="flex-1">
                    {c.time}
                    {c.day === "Hoy" && <span className="font-semibold"> — {rel(c)}</span>}
                  </span>
                  {selected && <span className="text-wine">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function OrderForm({ spots, delivery }: { spots: Spot[]; delivery: DeliverySettings }) {
  const cart = useCart();
  const now = useNow();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [spotName, setSpotName] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Choice | null>(null);
  const [notes, setNotes] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<Address>({ street: "", unit: "", city: "Richmond", zip: "" });
  const [instructions, setInstructions] = useState("");
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const top = useRef<HTMLDivElement>(null);

  // Points
  const [rewards, setRewards] = useState<Rewards>(undefined);
  const [firstOrder, setFirstOrder] = useState(false);
  const [codeSentTo, setCodeSentTo] = useState("");
  const [code, setCode] = useState("");
  const [rewardCode, setRewardCode] = useState("");
  const [rewardBusy, setRewardBusy] = useState(false);
  const [rewardError, setRewardError] = useState("");

  const delivering = type === "delivery";
  const truck = now ? truckStatus(spots, now) : null;
  const truckSpot = truck && truck.state !== "none" ? truck.spot : spots[0];
  const pickupSpot = spots.find((s) => s.name === spotName) ?? truckSpot;
  const lead = LEAD + (delivering ? delivery.extraMinutes : 0);
  // Pickup times come from the chosen spot; delivery times from every spot, leaving from wherever the truck is then
  const choices: Choice[] = !now
    ? []
    : delivering
      ? pickupDays.flatMap((day) => deliverySlots(spots, day, lead, now).map((s) => ({ day, time: s.time, spot: s.spot.name })))
      : pickupSpot
        ? pickupDays.flatMap((day) => pickupSlots(pickupSpot, day, lead, now).map((time) => ({ day, time })))
        : [];
  // A time that has passed (or a switch of spot) falls back to the soonest one
  const valid = (chosen && choices.find((c) => c.day === chosen.day && c.time === chosen.time)) ?? null;
  const when = valid || choices[0] || null;
  const spot = delivering ? spots.find((s) => s.name === when?.spot) : pickupSpot;
  const spotNow = now && spot ? truckStatus([spot], now) : null;

  // Delivery fee: miles from the truck's spot to the address, worked out on the server
  const [dq, setDq] = useState<{ key: string; quote: DeliveryQuote } | null>(null);
  const addrMissing = delivering ? addressProblem(address) : "";
  const quoteKey = delivering && !addrMissing && spot ? JSON.stringify([address.street.trim(), address.city.trim(), address.zip, spot.name]) : "";
  useEffect(() => {
    if (!quoteKey) return;
    const [street, city, zip, location] = JSON.parse(quoteKey);
    const t = setTimeout(async () => {
      let quote: DeliveryQuote;
      try {
        const res = await fetch("/api/delivery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: { street, city, zip }, location }) });
        quote = await res.json();
      } catch {
        quote = { error: "No pudimos calcular tu entrega. Intenta otra vez." };
      }
      setDq({ key: quoteKey, quote });
    }, 600);
    return () => clearTimeout(t);
  }, [quoteKey]);
  const dQuote = quoteKey && dq?.key === quoteKey ? dq.quote : null;
  const dOk = dQuote && "feeCents" in dQuote ? dQuote : null;

  const cleanPh = cleanPhone(phone);
  const cleanEm = cleanEmail(email);
  const lines = cart.lines.map(({ id, qty, options }) => ({ id, qty, options }));
  const hasDrink = freeDrinkCents(quote(lines, cart.menu).lines) > 0;
  // A free drink only counts while there's a drink in the order
  const reward = hasDrink ? rewardCode : "";
  const q = quote(lines, cart.menu, { deliveryFee: dOk ? dOk.feeCents : 0, discount: reward ? freeDrinkCents : firstOrder ? firstOrderCents : undefined });
  const serviceFee = q.platformFee + q.cardFee;

  const addrProblem = !delivering ? "" : addrMissing || (!dQuote ? "Calculando tu entrega…" : "error" in dQuote ? dQuote.error : "");
  const minProblem = delivering && q.subtotal < delivery.minCents ? `El mínimo para entrega es ${money(delivery.minCents / 100)} en comida y bebidas.` : "";
  const problems = {
    cart: cart.count === 0 ? "Agrega algo a tu orden primero." : "",
    time: !when ? (delivering ? "No hay horarios de entrega disponibles hoy ni mañana." : "No hay horarios de pickup disponibles hoy ni mañana en esta ubicación.") : "",
    address: addrProblem || minProblem,
    name: name.trim() ? "" : "Escribe tu nombre.",
    phone: cleanPh ? "" : "Escribe un teléfono de 10 números.",
    email: cleanEm ? "" : "Escribe tu correo para mandarte la confirmación.",
  };
  const firstProblem = Object.values(problems).find(Boolean) ?? "";

  const goTo = (s: 1 | 2) => {
    setStep(s);
    setError("");
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const next = async () => {
    setTried(true);
    if (firstProblem) return setError(firstProblem);
    goTo(2);
    setRewards(undefined);
    setFirstOrder(false);
    // Points for this phone, fetched fresh each time they get to the review
    try {
      const res = await fetch("/api/rewards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", phone: cleanPh, email: cleanEm }) });
      const data = await res.json();
      setRewards(res.ok ? { points: data.points, canRedeem: data.canRedeem } : null);
      setFirstOrder(res.ok && data.firstOrder === true);
    } catch {
      setRewards(null);
    }
  };

  const rewardCall = async (action: "send" | "verify") => {
    setRewardBusy(true);
    setRewardError("");
    try {
      const res = await fetch("/api/rewards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, phone: cleanPh, code }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Algo salió mal. Intenta otra vez.");
      if (action === "send") setCodeSentTo(data.emailHint);
      else setRewardCode(code);
    } catch (e) {
      setRewardError((e as Error).message);
    } finally {
      setRewardBusy(false);
    }
  };

  // The server re-prices the order, saves it and hands back a Stripe Checkout link
  const pay = async () => {
    if (firstProblem) {
      setTried(true);
      goTo(1);
      return setError(firstProblem);
    }
    if (sending || !when || !spot) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          notes,
          type,
          address: delivering ? address : undefined,
          instructions: delivering ? instructions : undefined,
          location: spot.name,
          day: when.day,
          time: when.time,
          rewardCode: reward || undefined,
          lines,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? "No pudimos iniciar el pago. Intenta otra vez.");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar el pago. Intenta otra vez.");
      setSending(false);
    }
  };

  const bad = (k: keyof typeof problems) => (tried && problems[k] ? "border-rose-dark" : "");
  const whenText = when ? `${when.day === "Hoy" ? "Hoy" : "Mañana"}, ${when.time}${!valid ? " (lo antes posible)" : ""}` : "";

  return (
    <PageTop>
      <div ref={top} className="scroll-mt-28">
        <h1 className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Finalizar Pedido <HeartDoodle className="w-9 h-9 text-rose" />
        </h1>
        <p className="mt-2 text-lg text-ink-soft">Completa la información de tu pedido.</p>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0">
          {/* Steps */}
          <ol className="mb-6 flex items-center gap-4">
            {(["Información", "Revisar y Pagar"] as const).map((label, i) => {
              const n = (i + 1) as 1 | 2;
              const on = step === n;
              return (
                <li key={label} className={`flex items-center gap-3 ${i === 0 ? "flex-1" : ""}`}>
                  <button
                    type="button"
                    onClick={() => (n === 1 ? goTo(1) : next())}
                    aria-current={on ? "step" : undefined}
                    className="flex items-center gap-3"
                  >
                    <span className={`grid h-10 w-10 place-items-center rounded-full border-2 font-bold ${on ? "border-wine bg-wine text-white" : "border-ink/70 text-ink"}`}>
                      {step > n ? "✓" : n}
                    </span>
                    <span className="whitespace-nowrap font-semibold">{label}</span>
                  </button>
                  {i === 0 && <span className="h-px flex-1 bg-ink/40" />}
                </li>
              );
            })}
          </ol>

          {step === 1 ? (
            <div className="space-y-6">
              {/* Above the next card so the time list isn't covered */}
              <Card icon={<StoreIcon className="w-8 h-8" />} title="Entrega o Pickup" className="relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["pickup", "Pickup en el truck", <BagIcon key="i" className="w-5 h-5" />],
                      ["delivery", "Entrega a domicilio", <CarIcon key="i" className="w-5 h-5" />],
                    ] as const
                  ).map(([t, label, icon]) => {
                    const on = type === t;
                    const off = t === "delivery" && !delivery.on;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={off}
                        onClick={() => setType(t)}
                        aria-pressed={on}
                        className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-4 text-sm font-semibold transition-colors sm:text-base ${
                          on ? "bg-wine text-white shadow-lg shadow-wine/20" : "border border-line bg-cream/60 text-ink hover:border-wine/50"
                        } disabled:opacity-50`}
                      >
                        {icon}
                        {label}
                        {on && <span className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-white text-xs text-wine">✓</span>}
                        {off && <span className="text-xs font-normal">(pronto)</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-5">
                  {delivering ? (
                    <div>
                      <Label icon={<PinIcon className="w-5 h-5" />}>Dirección de entrega</Label>
                      <div className="grid grid-cols-[1fr_7rem] gap-3">
                        <input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} placeholder="Calle y número" autoComplete="address-line1" className={`${input} ${tried && !address.street.trim() ? "border-rose-dark" : ""}`} />
                        <input value={address.unit} onChange={(e) => setAddress({ ...address, unit: e.target.value })} placeholder="Apt (opc.)" autoComplete="address-line2" className={input} />
                        <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="Ciudad" autoComplete="address-level2" className={input} />
                        <input
                          value={address.zip}
                          onChange={(e) => setAddress({ ...address, zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                          placeholder="ZIP"
                          inputMode="numeric"
                          autoComplete="postal-code"
                          className={`${input} ${tried && addrProblem ? "border-rose-dark" : ""}`}
                        />
                      </div>
                      <p className={`mt-2 text-sm ${dQuote && "error" in dQuote ? "font-semibold text-rose-dark" : dOk ? "font-semibold text-wine" : "text-ink-soft"}`}>
                        {dOk
                          ? `📍 ${dOk.label} desde ${spot?.name} · Entrega ${money(dOk.feeCents / 100)}`
                          : dQuote && "error" in dQuote
                            ? dQuote.error
                            : quoteKey
                              ? "Calculando tu entrega…"
                              : `La entrega se cobra por milla desde donde esté el truck (hasta ${milesText(delivery.maxMiles)})${delivery.minCents ? ` · mínimo ${money(delivery.minCents / 100)}` : ""}`}
                      </p>
                      {minProblem && <p className="mt-1 text-sm font-semibold text-rose-dark">Te faltan {money((delivery.minCents - q.subtotal) / 100)} para el mínimo de entrega.</p>}
                      <input value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={200} placeholder="Instrucciones (opc.): código de la puerta, dejar en el porche…" className={`${input} mt-3`} />
                    </div>
                  ) : (
                    <label className="block">
                      <Label icon={<PinIcon className="w-5 h-5" />}>Ubicación</Label>
                      <select value={spot?.name ?? ""} onChange={(e) => setSpotName(e.target.value)} className={input}>
                        {spots.map((l) => (
                          <option key={l.id}>{l.name}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  {!delivering && spotNow && spotNow.state !== "none" && (
                    <p
                      role="status"
                      className={`-mt-2 rounded-xl border px-3 py-2 text-sm ${
                        spotNow.state === "open" && !spotNow.closingSoon
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : spotNow.state === "open"
                            ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                            : "bg-blush border-rose/30 text-ink"
                      }`}
                    >
                      {spotNow.state === "later" && spotNow.spot.name === spot?.name ? "Aún no abrimos aquí. " : ""}
                      {statusLine(spotNow)}
                    </p>
                  )}

                  <div>
                    <Label icon={<ClockIcon className="w-5 h-5" />}>{delivering ? "¿Cuándo lo quieres recibir?" : "¿Cuándo quieres recoger tu pedido?"}</Label>
                    {now ? <TimePicker choices={choices} value={valid} asap={!valid} onChange={setChosen} now={now} /> : <div className="h-[50px] rounded-xl border border-line bg-white" />}
                  </div>

                  <label className="block">
                    <Label>Notas (opcional)</Label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Ej. sin whipped cream, extra nutella, etc." className={`${input} resize-none`} />
                  </label>
                </div>
              </Card>

              <Card title="Tus datos">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" autoComplete="name" className={`${input} sm:col-span-2 ${bad("name")}`} />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Teléfono (10 números)" type="tel" autoComplete="tel-national" inputMode="tel" className={`${input} ${bad("phone")}`} />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo electrónico" type="email" autoComplete="email" inputMode="email" className={`${input} ${bad("email")}`} />
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
                  <StarIcon className="w-4 h-4 shrink-0 text-rose" />
                  Tus puntos R&amp;X se guardan con tu teléfono. Te mandamos la confirmación por correo.
                </p>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card
                icon={<StoreIcon className="w-8 h-8" />}
                title={delivering ? "Entrega a domicilio" : "Pickup en el truck"}
                action={
                  <button type="button" onClick={() => goTo(1)} className="text-sm font-semibold text-wine underline">
                    Editar
                  </button>
                }
              >
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm text-ink-soft">{delivering ? "Dirección" : "Ubicación"}</dt>
                    <dd className="font-semibold">{delivering ? [address.street, address.unit && `#${address.unit}`, `${address.city} ${address.zip}`].filter(Boolean).join(", ") : spot?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-soft">{delivering ? "Entrega" : "Recoger"}</dt>
                    <dd className="font-semibold">{whenText}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink-soft">A nombre de</dt>
                    <dd className="font-semibold">{name}</dd>
                    <dd className="text-sm text-ink-soft">
                      {cleanPh} · {cleanEm}
                    </dd>
                  </div>
                  {delivering && instructions.trim() && (
                    <div>
                      <dt className="text-sm text-ink-soft">Instrucciones</dt>
                      <dd className="text-sm">{instructions}</dd>
                    </div>
                  )}
                  {notes.trim() && (
                    <div>
                      <dt className="text-sm text-ink-soft">Notas</dt>
                      <dd className="text-sm">{notes}</dd>
                    </div>
                  )}
                </dl>
              </Card>

              <Card icon={<StarIcon className="w-7 h-7" />} title="Puntos R&X">
                {rewards === undefined ? (
                  <p className="text-ink-soft">Revisando tus puntos…</p>
                ) : rewards === null ? (
                  <p className="text-ink-soft">Ganas {POINTS_PER_ORDER} puntos con este pedido. Con {POINTS_FOR_DRINK} puntos, tu siguiente bebida es gratis. ♡</p>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <p>
                        <span className="text-3xl font-extrabold text-wine">{Math.min(rewards.points, 999)}</span>
                        <span className="text-ink-soft"> / {POINTS_FOR_DRINK} puntos</span>
                      </p>
                      <span className="rounded-full bg-blush px-3 py-1 text-sm font-semibold text-wine">+{POINTS_PER_ORDER} con este pedido</span>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-blush">
                      <div className="h-full rounded-full bg-gradient-to-r from-rose to-wine transition-all" style={{ width: `${Math.min(100, (rewards.points / POINTS_FOR_DRINK) * 100)}%` }} />
                    </div>
                    <p className="mt-3 text-sm text-ink-soft">
                      Ganas {POINTS_PER_ORDER} puntos por cada pedido pagado. Con {POINTS_FOR_DRINK} puntos, tu siguiente bebida es gratis. ♡
                    </p>

                    {rewards.canRedeem && (
                      <div className="mt-4 rounded-2xl border border-rose/30 bg-blush/50 p-4">
                        {reward ? (
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-wine">✓ Bebida gratis aplicada (−{money(q.discount / 100)})</p>
                            <button type="button" onClick={() => setRewardCode("")} className="text-sm text-ink-soft underline">
                              Quitar
                            </button>
                          </div>
                        ) : !hasDrink ? (
                          <p className="font-semibold">🎉 ¡Tienes una bebida gratis! Agrega una bebida a tu orden para usarla.</p>
                        ) : !codeSentTo ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="font-semibold">🎉 ¡Tienes una bebida gratis!</p>
                            <button type="button" disabled={rewardBusy} onClick={() => rewardCall("send")} className="rounded-full bg-wine px-5 py-2.5 text-sm font-semibold text-white hover:bg-wine-dark disabled:opacity-60">
                              {rewardBusy ? "Enviando…" : "Usar mi bebida gratis"}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm">
                              Te mandamos un código de 6 números a <strong>{codeSentTo}</strong>.
                            </p>
                            <div className="mt-3 flex gap-2">
                              <input
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                placeholder="000000"
                                aria-label="Código"
                                className={`${input} max-w-40 text-center text-lg tracking-[0.3em]`}
                              />
                              <button type="button" disabled={rewardBusy || code.length !== 6} onClick={() => rewardCall("verify")} className="rounded-xl bg-wine px-5 font-semibold text-white hover:bg-wine-dark disabled:opacity-50">
                                {rewardBusy ? "…" : "Aplicar"}
                              </button>
                            </div>
                            <button type="button" disabled={rewardBusy} onClick={() => rewardCall("send")} className="mt-2 text-sm text-ink-soft underline">
                              Mandar otro código
                            </button>
                          </div>
                        )}
                        {rewardError && <p role="alert" className="mt-2 text-sm text-rose-dark">{rewardError}</p>}
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Order summary */}
        <aside className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-[0_10px_40px_rgba(140,42,60,0.10)] backdrop-blur sm:p-7 lg:sticky lg:top-28">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-3 font-hand text-3xl">
              <BagIcon className="w-8 h-8 text-wine" /> Tu Pedido ({cart.count})
            </h2>
            <Link href="/menu" className="text-sm font-semibold text-wine underline">
              Editar
            </Link>
          </div>

          {cart.lines.length === 0 ? (
            <p className="py-8 text-center text-ink-soft">
              Tu orden está vacía.{" "}
              <Link href="/menu" className="font-semibold text-wine underline">
                Ver el menú
              </Link>
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-line">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex items-center gap-3 py-3 first:pt-0">
                  {l.image !== NO_PHOTO && <Photo src={l.image} alt={l.name} className="h-16 w-16 shrink-0 rounded-2xl" sizes="64px" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{l.name}</p>
                    <p className="line-clamp-2 text-sm text-ink-soft">{l.summary || l.desc}</p>
                  </div>
                  <div className="flex shrink-0 items-center rounded-full border border-line bg-white">
                    <button onClick={() => cart.setQty(l.key, l.qty - 1)} aria-label={l.qty === 1 ? `Eliminar ${l.name}` : "Quitar uno"} className="grid h-9 w-9 place-items-center text-lg">
                      {l.qty === 1 ? <TrashIcon className="w-4 h-4 text-rose" /> : "−"}
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                    <button onClick={() => cart.setQty(l.key, l.qty + 1)} aria-label="Agregar uno" className="grid h-9 w-9 place-items-center text-lg">
                      +
                    </button>
                  </div>
                  <span className="w-16 shrink-0 text-right font-semibold">{money(l.price * l.qty)}</span>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-2 space-y-3 border-t border-line pt-4">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{money(q.subtotal / 100)}</dd>
            </div>
            {q.discount > 0 && (
              <div className="flex justify-between font-semibold text-wine">
                <dt>{discountLabel(reward ? POINTS_FOR_DRINK : 0, q.lines)}</dt>
                <dd>−{money(q.discount / 100)}</dd>
              </div>
            )}
            {delivering && (
              <div className="flex justify-between">
                <dt>Entrega{dOk ? ` (${dOk.label})` : ""}</dt>
                <dd>{dOk ? money(q.deliveryFee / 100) : "—"}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="group relative flex items-center gap-2">
                Tarifa de servicio
                <button type="button" aria-label="Qué incluye" className="peer grid h-5 w-5 place-items-center rounded-full border border-ink/60 text-xs font-bold">
                  i
                </button>
                <span role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl bg-ink px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity peer-hover:opacity-100 peer-focus:opacity-100">
                  {money(PLATFORM_FEE_PER_ITEM / 100)} por artículo ({money(q.platformFee / 100)}) + procesamiento de tarjeta ({money(q.cardFee / 100)}).
                </span>
              </dt>
              <dd>{money(serviceFee / 100)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-line pt-4">
              <dt className="text-2xl font-extrabold">Total</dt>
              <dd className="text-3xl font-extrabold text-wine">{money(q.total / 100)}</dd>
            </div>
          </dl>

          <button
            onClick={step === 1 ? next : pay}
            disabled={sending || cart.count === 0}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-wine py-4 text-lg font-semibold text-white shadow-lg shadow-wine/25 transition-colors hover:bg-wine-dark disabled:bg-line disabled:text-ink-soft disabled:shadow-none"
          >
            {sending ? "Abriendo pago…" : step === 1 ? "Continuar" : "Continuar al Pago"}
            {!sending && <ArrowRightIcon className="w-5 h-5" />}
          </button>
          {error && (
            <p role="alert" className="mt-3 text-center text-sm font-semibold text-rose-dark">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5">
              <LockIcon className="w-4 h-4" /> Pago seguro con Stripe
            </span>
            <span className="hidden h-4 w-px bg-line sm:block" />
            <span className="flex items-center gap-3 font-bold">
              <span className="flex items-center text-ink">
                <AppleIcon className="w-3.5 h-3.5" />
                Pay
              </span>
              <span className="text-ink">
                <span className="text-[#4285F4]">G</span> Pay
              </span>
              <span className="italic text-[#1a1f71]">VISA</span>
              <span className="flex" aria-label="Mastercard">
                <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
                <span className="-ml-1.5 h-4 w-4 rounded-full bg-[#f79e1b] mix-blend-multiply" />
              </span>
            </span>
          </div>
        </aside>
      </div>
      <div className="h-16" />
    </PageTop>
  );
}
