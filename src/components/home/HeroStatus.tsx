"use client";

import Link from "next/link";
import { truckStatus, type Spot } from "@/lib/schedule";
import { useNow } from "@/components/TruckNow";

/** Hero's second button: where the truck is right now, live */
export function HeroStatus({ spots }: { spots: Spot[] }) {
  const now = useNow();
  const s = now ? truckStatus(spots, now) : null;
  const open = s?.state === "open";
  const line =
    s?.state === "open"
      ? <><b className="font-semibold text-white">{s.closingSoon ? `Cerramos en ${s.minutesLeft} min` : "Abierto ahora"}</b><span className="hidden sm:inline"> · {s.spot.name}</span> · hasta las {s.closesAt}</>
      : s?.state === "later"
        ? <><b className="font-semibold text-white">Abrimos {s.day}</b> · {s.opensAt}<span className="hidden sm:inline">, {s.spot.name}</span></>
        : <b className="font-semibold text-white">Dónde estamos</b>;
  return (
    <Link
      href="/ubicaciones"
      className="group inline-flex min-h-12 items-center gap-3 rounded-full py-2.5 pl-4 pr-5 text-sm text-white/80 ring-1 ring-white/35 backdrop-blur-sm transition-colors hover:bg-white/10 sm:text-base"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
        {open && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />}
        <span className={`relative h-2.5 w-2.5 rounded-full ${open ? (s.closingSoon ? "bg-amber-400" : "bg-emerald-400") : "bg-white/60"}`} />
      </span>
      <span>{line}</span>
      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
  );
}
