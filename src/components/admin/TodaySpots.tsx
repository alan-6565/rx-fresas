"use client";

import { useEffect, useState } from "react";
import { Card, Toggle } from "@/components/admin/ui";
import { PinIcon } from "@/components/admin/icons";

type Spot = { id: string; name: string; place: string; hoursToday: string | null; closedToday: boolean };

/** One "Not today" switch per stop. Closing a stop stops online orders there until tomorrow. */
export function TodaySpots({ className = "" }: { className?: string }) {
  const [spots, setSpots] = useState<Spot[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    const res = await fetch("/api/admin/today", { cache: "no-store" });
    if (res.ok) setSpots(((await res.json()) as { spots: Spot[] }).spots);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load
    void load();
  }, []);

  const set = async (spot: Spot, closed: boolean) => {
    setBusy(spot.id);
    setError("");
    const res = await fetch("/api/admin/today", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: spot.id, closed }) });
    if (!res.ok) setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't save. Try again.");
    await load();
    setBusy(null);
  };

  if (!spots?.length) return null;
  return (
    <Card className={`p-4 ${className}`}>
      <p className="font-bold">Today&apos;s stops</p>
      <ul className="mt-2 divide-y divide-line">
        {spots.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-semibold">
                <PinIcon className="w-4 h-4 shrink-0 text-rose" /> {s.name}
              </span>
              <span className="block pl-[22px] text-xs text-ink-soft">
                {s.closedToday ? "Closed today. Online orders here are off until tomorrow." : s.hoursToday ? `Open today ${s.hoursToday}` : "Not open today on the schedule"}
              </span>
            </span>
            {(s.hoursToday || s.closedToday) && (
              <span className="flex shrink-0 items-center gap-2 text-sm font-semibold">
                <span className={s.closedToday ? "text-rose-dark" : "text-ink-soft"}>Not today</span>
                <Toggle on={s.closedToday} disabled={busy === s.id} onChange={(on) => set(s, on)} label={`${s.name}: not today`} />
              </span>
            )}
          </li>
        ))}
      </ul>
      {error && <p className="mt-1 text-sm text-rose-dark">{error}</p>}
    </Card>
  );
}
