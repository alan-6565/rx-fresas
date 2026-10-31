"use client";

import { useEffect, useState } from "react";
import { mapsUrl, truckStatus, type Spot, type SpotStatus } from "@/lib/schedule";
import { PinIcon } from "@/components/icons";

/** Ticks every 30 seconds so "open now" and "closing soon" stay right without a reload */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);
  return now;
}

export function statusLine(s: SpotStatus) {
  if (s.state === "open")
    return s.closingSoon ? `¡Cerramos en ${s.minutesLeft} min! (${s.closesAt})` : `Abierto ahora · hasta las ${s.closesAt}`;
  if (s.state === "later") return `Abrimos ${s.day} a las ${s.opensAt}`;
  return "";
}

/** "Ahora en El Portal · Abierto hasta las 10:00 p.m." with a directions link */
export function TruckNow({ spots, className = "" }: { spots: Spot[]; className?: string }) {
  const now = useNow();
  if (!now) return <div className={`min-h-14 ${className}`} />;
  const s = truckStatus(spots, now);
  if (s.state === "none") return null;

  const tone = s.state === "open" ? (s.closingSoon ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800") : "bg-blush border-rose/30 text-ink";
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border px-5 py-3 text-center ${tone} ${className}`}>
      <span className="flex items-center gap-2 font-semibold">
        <PinIcon className="w-5 h-5 shrink-0 text-rose" />
        {s.state === "open" ? "Ahora en" : "Próxima parada:"} {s.spot.name}
      </span>
      <span>{statusLine(s)}</span>
      <a href={mapsUrl(s.spot)} target="_blank" rel="noreferrer" className="font-semibold text-rose underline">
        Cómo llegar
      </a>
    </div>
  );
}
