"use client";

import { truckStatus, type Spot } from "@/lib/schedule";
import { pacificDate } from "@/lib/time";
import { useNow } from "@/components/TruckNow";

// Worked out in the browser, since the page itself is only rebuilt when the
// staff change something.
export function OpenBadge({ spot }: { spot: Spot }) {
  const now = useNow();
  if (!now) return null;
  const s = truckStatus([spot], now);
  if (s.state === "open" && s.closingSoon) return <span className="rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-sm font-semibold text-amber-800">Cierra pronto</span>;
  const state = s.state === "open" ? "open" : spot.closedOn === pacificDate(0, now) ? "closed-today" : null;

  if (state === "open") return <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-700">Abierto ahora</span>;
  if (state === "closed-today") return <span className="rounded-full bg-blush border border-rose/30 px-3 py-1 text-sm font-semibold text-rose">Cerrado hoy</span>;
  return null;
}
