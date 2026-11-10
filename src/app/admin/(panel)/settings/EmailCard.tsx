"use client";

import { useState } from "react";
import { Card, btn } from "@/components/admin/ui";

type Result = { ok: true; to: string; from: string } | { ok: false; fix: string; raw: string; from?: string };

/** Settings → Email: checks that order emails really send */
export function EmailCard({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const test = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/email-test", { method: "POST" });
      setResult((await res.json()) as Result);
    } catch {
      setResult({ ok: false, fix: "Couldn't reach the server. Try again.", raw: "" });
    }
    setBusy(false);
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Email</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${configured ? "border-line bg-cream text-ink-soft" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{configured ? "Connected" : "Not set up"}</span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">New-order alerts and customer receipts are sent from your website’s address and go to the email under Contact &amp; socials. Send a test to make sure it works.</p>
      {result && (
        <div className={`mt-3 rounded-xl border px-4 py-3 text-sm ${result.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {result.ok ? (
            <p>✓ Sent from {result.from} to {result.to}. Check that inbox.</p>
          ) : (
            <>
              <p>{result.fix}</p>
              {result.from && <p className="mt-1 text-xs opacity-80">Sending from: {result.from}</p>}
              {result.raw && <p className="mt-1 break-words font-mono text-xs opacity-80">Resend said: {result.raw}</p>}
            </>
          )}
        </div>
      )}
      <div className="mt-4">
        <button onClick={test} disabled={busy} className={btn.primary}>
          {busy ? "Sending…" : "Send test email"}
        </button>
      </div>
    </Card>
  );
}
