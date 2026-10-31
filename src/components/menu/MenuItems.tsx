"use client";

import { useEffect, useState } from "react";
import type { Item } from "@/lib/data";
import { money } from "@/lib/data";
import { hasRequiredUpcharge } from "@/lib/options";
import { Photo } from "@/components/ui";
import { AddButton } from "@/components/AddButton";

// The menu's item cards, with "Buscar en el menú…" (searches every category)
// and a heart to mark favorites, remembered on this device only.

const FAV_KEY = "rx-menu-favoritos";
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function MenuItems({ title, items, all }: { title: string; items: Item[]; all: Item[] }) {
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]");
        if (Array.isArray(saved)) setFavs(saved);
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {}
  };

  const q = plain(query.trim());
  const shown = q ? all.filter((i) => plain(`${i.name} ${i.desc}`).includes(q)) : items;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 font-hand text-5xl text-ink sm:text-6xl">
          {q ? "Resultados" : title}
          <svg viewBox="0 0 60 12" className="w-14 h-3 text-rose" fill="none" aria-hidden>
            <path d="M2 8c8-6 14 4 22-1s14-5 22 0 10 2 12-1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </h2>
        <label className="relative w-full sm:w-96">
          <svg viewBox="0 0 24 24" className="absolute left-4 top-1/2 w-5 h-5 -translate-y-1/2 text-ink" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el menú…"
            aria-label="Buscar en el menú"
            className="w-full rounded-full border border-line bg-white/80 py-3 pl-12 pr-5 text-base shadow-sm focus:border-rose focus:outline-none"
          />
        </label>
      </div>

      {shown.length === 0 ? (
        <p className="mt-6 text-lg text-ink-soft">{q ? "No encontramos nada con ese nombre. ♡" : "Pronto habrá más antojos aquí. ♡"}</p>
      ) : (
        <div key={q || title} className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((item, i) => {
            const fav = favs.includes(item.id);
            return (
              <article
                key={item.id}
                style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}
                className="rx-hero-in flex gap-4 rounded-[1.75rem] border border-white bg-white/90 p-3 shadow-[0_10px_30px_rgba(232,80,106,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(232,80,106,0.18)]"
              >
                <Photo slot={`item:${item.id}`} src={item.image} alt={item.name} className="aspect-[4/5] w-32 shrink-0 rounded-2xl sm:w-40" sizes="160px" />
                <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold leading-tight">{item.name}</h3>
                    <button
                      type="button"
                      onClick={() => toggleFav(item.id)}
                      aria-pressed={fav}
                      aria-label={fav ? `Quitar ${item.name} de favoritos` : `Guardar ${item.name} en favoritos`}
                      className="-mr-1 -mt-1 shrink-0 p-1 text-rose transition-transform active:scale-90"
                    >
                      <svg viewBox="0 0 24 24" className="w-7 h-7" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.1 1.8-1.9 3.3-3.1 5.4-3.1 3.6 0 5.4 3.8 3.8 6.9C19 15.6 12 20 12 20Z" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <span className="mt-2 self-start rounded-full bg-blush px-3 py-1 font-bold">
                    {hasRequiredUpcharge({ price: item.price, options: item.options ?? [] }) && "Desde "}
                    <span className="text-rose">{money(item.price)}</span>
                  </span>
                  <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{item.desc}</p>
                  <AddButton id={item.id} variant="outline" className="mt-auto self-start" />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
