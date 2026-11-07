"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

export type DrinkSlide = { id: string; name: string; image: string; category: string; price: string; percent: number };

const AUTO_MS = 3500;

/** A small swipeable row of drinks that moves on its own until someone touches it */
export function DrinkCarousel({ slides }: { slides: DrinkSlide[] }) {
  const row = useRef<HTMLUListElement>(null);
  const [paused, setPaused] = useState(false);

  const move = (direction: 1 | -1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = (card?.offsetWidth ?? 200) + 16;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    const atStart = el.scrollLeft <= 8;
    if (direction === 1 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (direction === -1 && atStart) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => move(1), AUTO_MS);
    return () => clearInterval(t);
  }, [paused]);

  const arrow = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-wine shadow-md hover:bg-blush sm:grid";

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={() => setPaused(true)} onFocus={() => setPaused(true)}>
      <button type="button" onClick={() => move(-1)} aria-label="Anterior" className={`${arrow} -left-3`}>
        <ArrowLeftIcon className="h-5 w-5" />
      </button>
      <ul ref={row} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-2">
        {slides.map((s) => (
          <li key={s.id} className="w-40 shrink-0 snap-start sm:w-48">
            <Link href={`/menu#${s.category}`} className="group block overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <span className="relative block">
                <Photo src={s.image} alt={s.name} className="aspect-square" sizes="192px" />
                <span className="absolute left-2 top-2 rounded-full bg-wine px-2.5 py-1 text-xs font-bold text-white shadow">Hasta {s.percent}%</span>
              </span>
              <span className="block p-3 text-center">
                <span className="block truncate font-semibold leading-tight group-hover:text-rose">{s.name}</span>
                <span className="mt-1 block text-sm font-bold text-rose">{s.price}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => move(1)} aria-label="Siguiente" className={`${arrow} -right-3`}>
        <ArrowRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
