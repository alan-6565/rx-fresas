"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Item } from "@/lib/data";
import { isFresa, money } from "@/lib/data";
import { hasRequiredUpcharge } from "@/lib/options";
import { Photo } from "@/components/ui";
import { AddButton } from "@/components/AddButton";
import { BuilderSheet } from "@/components/antojo/BuilderSheet";

// The whole menu on one scroll, one section per category. The fresas styles
// share a single card whose "Personalizar" opens the builder box. "Buscar en
// el menú…" searches everything; hearts are remembered on this device only.

export type MenuSection = { id: string; label: string; title: string; badge?: string; items: Item[] };

const FAV_KEY = "rx-menu-favoritos";
const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Squiggle() {
  return (
    <svg viewBox="0 0 60 12" className="w-14 h-3 text-rose" fill="none" aria-hidden>
      <path d="M2 8c8-6 14 4 22-1s14-5 22 0 10 2 12-1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MenuItems({ sections }: { sections: MenuSection[] }) {
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState<string[]>([]);
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]");
        if (Array.isArray(saved)) setFavs(saved);
      } catch {}
      // Old links: /menu?cat=pancakes
      const cat = new URLSearchParams(location.search).get("cat");
      if (cat && !location.hash) document.getElementById(cat)?.scrollIntoView();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Light up the pill of the section being read
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [sections, query]);

  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {}
  };

  const q = plain(query.trim());
  const results = q ? sections.flatMap((s) => s.items).filter((i) => plain(`${i.name} ${i.desc}`).includes(q)) : [];
  const card = (item: Item, i: number) => <ItemCard key={item.id} item={item} i={i} fav={favs.includes(item.id)} onFav={() => toggleFav(item.id)} />;

  return (
    <div className="mt-10">
      {/* Category pills that stay on screen while scrolling */}
      <div className="rx-below-nav sticky z-30 -mx-4 flex flex-wrap items-center gap-3 border-b border-line/60 bg-cream/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <nav className="flex min-w-0 flex-1 gap-2 overflow-x-auto no-scrollbar" aria-label="Secciones del menú">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setQuery("")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active === s.id && !q ? "bg-rose text-white shadow" : "bg-white text-ink hover:text-rose"}`}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <label className="relative w-full sm:w-80">
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
            className="w-full rounded-full border border-line bg-white py-2.5 pl-12 pr-5 text-base shadow-sm focus:border-rose focus:outline-none"
          />
        </label>
      </div>

      {q ? (
        <section className="mt-10">
          <h2 className="flex items-center gap-3 font-hand text-5xl text-ink sm:text-6xl">
            Resultados <Squiggle />
          </h2>
          {results.length ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{results.map(card)}</div>
          ) : (
            <p className="mt-6 text-lg text-ink-soft">No encontramos nada con ese nombre. ♡</p>
          )}
        </section>
      ) : (
        sections.map((s) => {
          const cups = s.items.filter(isFresa);
          const rest = s.items.filter((i) => !isFresa(i));
          return (
            <section key={s.id} id={s.id} className="scroll-mt-40 pt-12">
              <h2 className="flex items-center gap-3 font-hand text-5xl text-ink sm:text-6xl">
                {s.title} <Squiggle />
                {s.badge && <span className="rounded-full bg-rose px-3 py-1 font-ui text-xs font-bold text-white">{s.badge}</span>}
              </h2>
              {s.items.length === 0 ? (
                <p className="mt-6 text-lg text-ink-soft">
                  {s.id === "extras" ? (
                    <>
                      Los toppings y extras se eligen al personalizar tu orden.{" "}
                      <Link href="#toppings" className="font-semibold text-rose underline">
                        Ver toppings
                      </Link>
                    </>
                  ) : (
                    "Pronto habrá más antojos aquí. ♡"
                  )}
                </p>
              ) : (
                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {cups.length > 0 && <FresasCard cups={cups} fav={favs.includes("fresas")} onFav={() => toggleFav("fresas")} />}
                  {rest.map((item, i) => card(item, i + (cups.length ? 1 : 0)))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function Heart({ on, name, onClick }: { on: boolean; name: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={on ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`}
      className="-mr-1 -mt-1 shrink-0 p-1 text-rose transition-transform active:scale-90"
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 20s-7-4.4-9.2-8.6C1.2 8.3 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.1 1.8-1.9 3.3-3.1 5.4-3.1 3.6 0 5.4 3.8 3.8 6.9C19 15.6 12 20 12 20Z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

const cardClass =
  "rx-hero-in flex gap-4 rounded-[1.75rem] border border-white bg-white/90 p-3 shadow-[0_10px_30px_rgba(232,80,106,0.10)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(232,80,106,0.18)]";

function ItemCard({ item, i, fav, onFav }: { item: Item; i: number; fav: boolean; onFav: () => void }) {
  return (
    <article style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }} className={cardClass}>
      <Photo slot={`item:${item.id}`} src={item.image} alt={item.name} className="aspect-[4/5] w-32 shrink-0 rounded-2xl sm:w-40" sizes="160px" />
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight">{item.name}</h3>
          <Heart on={fav} name={item.name} onClick={onFav} />
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
}

/** All the fresas styles in one card; the photo cycles through them */
function FresasCard({ cups, fav, onFav }: { cups: Item[]; fav: boolean; onFav: () => void }) {
  const [shown, setShown] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (cups.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setShown((n) => (n + 1) % cups.length), 2600);
    return () => clearInterval(t);
  }, [cups.length]);

  const from = Math.min(...cups.map((c) => c.price));
  const styles = cups.map((c) => c.name.replace(/^Fresas con Crema /, ""));

  return (
    <article className={cardClass}>
      <div className="relative aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-2xl sm:w-40">
        {cups.map((c, i) => (
          <Photo
            key={c.id}
            slot={`item:${c.id}`}
            src={c.image}
            alt={i === shown ? c.name : ""}
            className={`absolute inset-0 transition-opacity duration-700 ${i === shown ? "opacity-100" : "opacity-0"}`}
            sizes="160px"
          />
        ))}
        <span className="absolute inset-x-2 bottom-2 truncate rounded-full bg-white/90 px-2 py-0.5 text-center text-xs font-bold text-rose">{styles[shown]}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold leading-tight">Fresas con Crema</h3>
          <Heart on={fav} name="Fresas con Crema" onClick={onFav} />
        </div>
        <span className="mt-2 self-start rounded-full bg-blush px-3 py-1 font-bold">
          Desde <span className="text-rose">{money(from)}</span>
        </span>
        <p className="mt-2 text-sm text-ink-soft">
          {cups.length} estilos: {styles.join(", ")}. Elige el tuyo, tu tamaño y tus toppings.
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {cups.map((c, i) => (
            <span key={c.id} className={`h-1.5 rounded-full transition-all ${i === shown ? "w-5 bg-rose" : "w-1.5 bg-rose/30"}`} />
          ))}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="mt-auto self-start rounded-full border-2 border-rose/70 bg-white px-5 py-2 text-base font-semibold text-rose transition-colors hover:border-rose hover:bg-rose hover:text-white"
        >
          + Personalizar
        </button>
      </div>
      {open && <BuilderSheet initialId={cups[shown]?.id} onClose={() => setOpen(false)} />}
    </article>
  );
}
