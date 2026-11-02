"use client";

import { useState } from "react";
import type { DeliverySettings } from "@/lib/delivery";
import { Card, Field, Toggle, btn, field } from "@/components/admin/ui";

const dollars = (cents: number) => (cents / 100).toFixed(2).replace(/\.00$/, "");

/** Settings → Delivery: on/off, fee, minimum and the ZIP codes they drive to */
export function DeliveryCard({ initial, emailOn }: { initial: DeliverySettings; emailOn: boolean }) {
  const [on, setOn] = useState(initial.on);
  const [fee, setFee] = useState(dollars(initial.feeCents));
  const [min, setMin] = useState(dollars(initial.minCents));
  const [extra, setExtra] = useState(String(initial.extraMinutes));
  const [zips, setZips] = useState(initial.zips.join(", "));
  const [state, setState] = useState<"" | "saving" | "saved">("");
  const [error, setError] = useState("");

  const save = async () => {
    setState("saving");
    setError("");
    const res = await fetch("/api/admin/delivery", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ on, feeCents: Math.round(Number(fee) * 100), minCents: Math.round(Number(min) * 100), extraMinutes: Number(extra), zips }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save");
      return setState("");
    }
    setZips(data.delivery.zips.join(", "));
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
      <p className="mt-1 text-sm text-ink-soft">The delivery fee is all yours. Delivery orders show 🚗 and the address in Orders, and the customer gets an &quot;on its way&quot; email when you tap Out for Delivery.</p>

      <div className={`mt-4 grid gap-4 sm:grid-cols-3 ${on ? "" : "opacity-50"}`}>
        <Field label="Delivery fee ($)">
          <input value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" className={field} />
        </Field>
        <Field label="Order minimum ($)" hint="Food and drinks, before fees">
          <input value={min} onChange={(e) => setMin(e.target.value)} inputMode="decimal" className={field} />
        </Field>
        <Field label="Extra time (minutes)" hint="Added to the earliest time customers can pick">
          <input value={extra} onChange={(e) => setExtra(e.target.value)} inputMode="numeric" className={field} />
        </Field>
        <div className="sm:col-span-3">
          <Field label="ZIP codes you deliver to" hint="Separate with commas">
            <input value={zips} onChange={(e) => setZips(e.target.value)} className={field} />
          </Field>
        </div>
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
