"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Spot } from "@/lib/schedule";

// Every stop on one map with a labeled pink pin, like the mockup. Leaflet with
// OpenStreetMap's tiles, so no map API key is needed.
export function SpotsMap({ spots, className = "" }: { spots: Spot[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const pinned = spots.filter((s) => s.lat != null && s.lng != null);
  const key = pinned.map((s) => `${s.id}:${s.lat},${s.lng}`).join("|");

  useEffect(() => {
    if (!box.current || pinned.length === 0) return;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
      // The western pin's label drops below it, so two nearby labels don't overlap
      const midLng = pinned.reduce((n, s) => n + s.lng!, 0) / pinned.length;
      for (const s of pinned) {
        const side = pinned.length > 1 && s.lng! < midLng ? "rx-pin rx-pin-low" : "rx-pin";
        const icon = L.divIcon({
          className: "",
          iconSize: [0, 0],
          html: `<div class="${side}"><svg viewBox="0 0 24 24" width="30" height="30"><path fill="#e8506a" stroke="#fff" stroke-width="1.5" d="M12 22s7.5-7 7.5-12.5a7.5 7.5 0 0 0-15 0C4.5 15 12 22 12 22Z"/><circle cx="12" cy="9.5" r="2.8" fill="#fff"/></svg><span><strong>${esc(s.name)}</strong></span></div>`,
        });
        L.marker([s.lat!, s.lng!], { icon, title: s.name }).addTo(map);
      }
      map.fitBounds(L.latLngBounds(pinned.map((s) => [s.lat!, s.lng!])), { paddingTopLeft: [40, 50], paddingBottomRight: [160, 60], maxZoom: 15 });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redraw only when the pins change
  }, [key]);

  return <div ref={box} className={`z-0 ${className}`} role="img" aria-label={`Mapa con ${pinned.length} ubicaciones`} />;
}
