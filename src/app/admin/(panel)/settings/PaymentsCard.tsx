"use client";

import { useState } from "react";
import type { PaymentsStatus } from "@/lib/payments";
import { Card, btn } from "@/components/admin/ui";

/** Settings → Payments: R&X signs up with Stripe and later opens their payouts from here */
export function PaymentsCard({ status, back }: { status: PaymentsStatus; back: boolean }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState(status.error ?? "");

  const go = async (action: "onboard" | "dashboard") => {
    setBusy(action);
    setError("");
    try {
      const res = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!data.url) throw new Error(data.error ?? "Something went wrong");
      location.href = data.url;
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  };

  const ready = status.cardPayments === "active" && status.due === 0;
  const state = !status.accountId
    ? { label: "Not set up", cls: "bg-cream text-ink-soft border-line" }
    : ready
      ? { label: "✓ Taking card payments", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : { label: status.due ? `${status.due} step${status.due > 1 ? "s" : ""} left` : "Stripe is reviewing", cls: "bg-amber-50 text-amber-700 border-amber-200" };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Payments</h2>
        <span className="flex flex-wrap gap-2">
          {!status.live && <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">Test mode</span>}
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${state.cls}`}>{state.label}</span>
        </span>
      </div>

      {ready ? (
        <p className="mt-1 text-sm text-ink-soft">Online orders are paid straight into your Stripe account and sent to your bank. You keep the full menu price; the customer pays the service and card fees.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-ink-soft">
            Connect your bank with Stripe so online orders pay you directly. It takes about 10 minutes. Have ready:
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-ink-soft">
            <li>The owner&apos;s ID, date of birth and last 4 of their Social Security number (or the business EIN)</li>
            <li>Bank account and routing number for payouts</li>
            <li>A phone that can get a text code</li>
          </ul>
        </>
      )}

      {back && !ready && status.accountId && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {status.due ? "Stripe still needs a few things. Tap Continue to pick up where you left off." : "All sent! Stripe usually approves within a few minutes, sometimes a day or two."}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {!ready && (
          <button onClick={() => go("onboard")} disabled={!!busy || !!status.error} className={btn.primary}>
            {busy === "onboard" ? "Opening Stripe…" : status.accountId ? "Continue Stripe setup" : "Set up payments"}
          </button>
        )}
        {status.accountId && (
          <button onClick={() => go("dashboard")} disabled={!!busy} className={btn.ghost}>
            {busy === "dashboard" ? "Opening…" : "Payouts & bank (Stripe)"}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
    </Card>
  );
}
