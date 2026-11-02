"use client";

import { useState } from "react";
import { centsPerMile, cleanDelivery, deliveryFee, type DeliverySettings } from "@/lib/delivery";
import { Card, Field, Toggle, btn, field } from "@/components/admin/ui";

const dollars = (cents: number) => (cents / 100).toFixed(2);
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

/** Settings → Delivery: priced by the mile from wherever the truck is parked */
export function DeliveryCard({ initial, emailOn }: { initial: DeliverySettings; emailOn: boolean }) {
  const [on, setOn] = useState(initial.on);
  const [roundTrip, setRoundTrip] = useState(initial.roundTrip);
  const [f, setF] = useState({
    base: dollars(initial.baseCents),
    gas: dollars(initial.gasCents),
    mpg: String(initial.mpg),
    perMile: dollars(initial.perMileCents),
    max: String(initial.maxMiles),
    min: dollars(initial.minCents),
    extra: String(initial.extraMinutes),
  });
  const [state, setState] = useState<"" | "saving" | "saved">("");
  const [error, setError] = useState("");

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const settings = {
    on,
    roundTrip,
    baseCents: Math.round(Number(f.base) * 100),
    gasCents: Math.round(Number(f.gas) * 100),
    mpg: Number(f.mpg),
    perMileCents: Math.round(Number(f.perMile) * 100),
    maxMiles: Number(f.max),
    minCents: Math.round(Number(f.min) * 100),
    extraMinutes: Number(f.extra),
  };
  // What customers would pay, using the numbers as typed
  const preview = cleanDelivery(settings);

  const save = async () => {
    setState("saving");
    setError("");
    const res = await fetch("/api/admin/delivery", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save");
      return setState("");
    }
    setState("saved");
    setTimeout(() => setState(""), 2000);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Delivery</h2>
        <span className="flex items-center gap-2 text-sm font-semibold">
          {on ? "Customers can choose delivery" : "Pickup only"}
          <Toggle on={on} onChange={setOn} label="Offer delivery" />
        </span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        The fee is figured from wherever the truck is parked at the delivery time to the customer&apos;s door. It&apos;s all yours. Delivery orders show 🚗 and the address in Orders, and the customer gets an &quot;on its way&quot; email when you tap Out for Delivery.
      </p>

      <div className={`mt-4 grid gap-4 sm:grid-cols-4 ${on ? "" : "opacity-50"}`}>
        <Field label="Base fee ($)">
          <input value={f.base} onChange={set("base")} inputMode="decimal" className={field} />
        </Field>
        <Field label="Gas ($ per gallon)">
          <input value={f.gas} onChange={set("gas")} inputMode="decimal" className={field} />
        </Field>
        <Field label="Car's miles per gallon">
          <input value={f.mpg} onChange={set("mpg")} inputMode="decimal" className={field} />
        </Field>
        <Field label="Extra per mile ($)" hint="Driver time, car wear">
          <input value={f.perMile} onChange={set("perMile")} inputMode="decimal" className={field} />
        </Field>
        <Field label="Farthest (miles)">
          <input value={f.max} onChange={set("max")} inputMode="decimal" className={field} />
        </Field>
        <Field label="Order minimum ($)" hint="Food and drinks">
          <input value={f.min} onChange={set("min")} inputMode="decimal" className={field} />
        </Field>
        <Field label="Extra time (min)" hint="Added to the earliest time">
          <input value={f.extra} onChange={set("extra")} inputMode="numeric" className={field} />
        </Field>
        <label className="flex items-center gap-3 self-center text-sm font-medium">
          <Toggle on={roundTrip} onChange={setRoundTrip} label="Charge the drive back" />
          Charge the drive back too
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-cream/60 px-4 py-3 text-sm">
        <p className="font-semibold">
          {usd(centsPerMile(preview))} per mile driven{preview.roundTrip ? ", there and back" : ""} + {usd(preview.baseCents)} base
        </p>
        <p className="mt-1 text-ink-soft">
          {[1, 3, 5].filter((m) => m <= preview.maxMiles).map((m) => `${m} mi away → ${usd(deliveryFee(m, preview))}`).join(" · ")}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={save} disabled={state === "saving"} className={btn.primary}>
          {state === "saving" ? "Saving…" : state === "saved" ? "✓ Saved" : "Save delivery"}
        </button>
        {error && <p className="text-sm text-rose-700">{error}</p>}
      </div>

      <p className={`mt-5 rounded-xl border px-4 py-2 text-sm ${emailOn ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
        {emailOn
          ? "✓ Customer emails are on: order confirmation, ready / on its way, and free-drink codes."
          : "Customer emails aren't connected yet, so confirmations, ready emails and free-drink codes are paused."}
      </p>
    </Card>
  );
}
