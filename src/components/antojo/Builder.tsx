"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Item } from "@/lib/data";
import { money } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { defaultPicks, groupHint, pickedSummary, priceSelection, type OptionGroup } from "@/lib/options";
import { CupPreview, type CupLook } from "@/components/antojo/CupPreview";
import { HeartDoodle } from "@/components/icons";

// "Crea tu antojo": build a fresas con crema step by step and watch the cup
// change. Uses the same options, prices and cart as the rest of the menu, so
// anything the staff change in the dashboard shows up here too.

type Favorite = { id: string; options: string[]; label: string };
const FAV_KEY = "rx-favoritos";

const readFavs = (): Favorite[] => {
  try {
    const list = JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const inGroup = (picks: string[], g: OptionGroup) => picks.filter((p) => p.startsWith(`${g.id}:`)).map((p) => p.slice(g.id.length + 1));

export function Builder({ items }: { items: Item[] }) {
  const cart = useCart();
  const [baseId, setBaseId] = useState(items[0]?.id ?? "");
  const base = items.find((i) => i.id === baseId) ?? items[0];
  const groups = base?.options ?? [];
  const [picks, setPicks] = useState<string[]>(() => (base ? defaultPicks({ ...base, options: groups }) : []));
  const [tried, setTried] = useState(false);
  const [added, setAdded] = useState(false);
  const [favs, setFavs] = useState<Favorite[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setFavs(readFavs()), 0);
    return () => clearTimeout(t);
  }, []);

  if (!base) return <p className="mt-10 text-center text-ink-soft">Pronto podrás crear tu antojo aquí. ♡</p>;

  // Switching cups keeps whatever still applies (size, toppings…)
  const chooseBase = (id: string, keep = picks) => {
    const next = items.find((i) => i.id === id);
    if (!next) return;
    const valid = new Set((next.options ?? []).flatMap((g) => g.choices.map((c) => `${g.id}:${c.id}`)));
    const kept = keep.filter((p) => valid.has(p));
    const defaults = defaultPicks({ ...next, options: next.options ?? [] }).filter((d) => !kept.some((k) => k.split(":")[0] === d.split(":")[0]));
    setBaseId(id);
    setPicks([...kept, ...defaults]);
    setTried(false);
  };

  const toggle = (g: OptionGroup, choiceId: string) => {
    const key = `${g.id}:${choiceId}`;
    setPicks((prev) => {
      if (g.max === 1) return prev.includes(key) && g.min === 0 ? prev.filter((p) => p !== key) : [...prev.filter((p) => !p.startsWith(`${g.id}:`)), key];
      if (prev.includes(key)) return prev.filter((p) => p !== key);
      if (inGroup(prev, g).length >= g.max) return prev;
      return [...prev, key];
    });
  };

  let unit = Math.round(base.price * 100);
  let problem = "";
  let summary = "";
  try {
    const r = priceSelection({ ...base, options: groups }, picks);
    unit = r.unit;
    summary = pickedSummary(r.picked);
  } catch (e) {
    problem = (e as Error).message.replace(`${base.name}: `, "");
  }

  const find = (id: string) => groups.find((g) => g.id === id);
  const look: CupLook = {
    base: base.id,
    size: (find("tamano") && inGroup(picks, find("tamano")!)[0]) || "12-oz",
    crema: (find("crema") && inGroup(picks, find("crema")!)[0]) || "casa",
    drizzles: find("drizzles") ? inGroup(picks, find("drizzles")!) : [],
    toppings: find("toppings") ? inGroup(picks, find("toppings")!) : [],
  };

  const add = () => {
    setTried(true);
    if (problem) return;
    cart.add(base.id, picks);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  };

  const saveFav = () => {
    if (problem) return setTried(true);
    const fav = { id: base.id, options: [...picks].sort(), label: `${base.name}${summary ? ` · ${summary}` : ""}` };
    const next = [fav, ...readFavs().filter((f) => !(f.id === fav.id && f.options.join() === fav.options.join()))].slice(0, 6);
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {}
    setFavs(next);
  };

  return (
    <div className="mt-10 grid gap-6 md:grid-cols-[1fr_1.05fr] items-start">
      {/* Live cup */}
      <section className="md:sticky md:top-28 rounded-[2rem] border border-line bg-gradient-to-b from-blush to-cream p-5 sm:p-8 text-center shadow-sm">
        <div className="mx-auto max-w-[230px] sm:max-w-[280px] lg:max-w-[380px]">
          <CupPreview look={look} label={`${base.name}: ${summary}`} />
        </div>
        <p className="mt-2 font-hand text-4xl leading-none">{base.name}</p>
        <p className="mt-2 min-h-12 text-ink-soft">{summary || "Elige tus opciones ♡"}</p>
        <p className="mt-3 text-xs text-ink-soft/80">Vista ilustrativa · cada vaso se prepara a mano</p>
      </section>

      {/* Steps */}
      <section className="rounded-[2rem] border border-line bg-white p-5 sm:p-8 shadow-sm pb-28 lg:pb-8">
        {favs.length > 0 && (
          <div className="mb-6 rounded-2xl bg-blush/60 p-4">
            <p className="flex items-center gap-2 font-bold">
              <HeartDoodle className="w-5 h-5 text-rose" /> Mis favoritos
            </p>
            <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
              {favs.map((f, i) => (
                <button
                  key={i}
                  onClick={() => chooseBase(f.id, f.options)}
                  className="shrink-0 max-w-64 truncate rounded-full border border-rose/30 bg-white px-3 py-1.5 text-sm hover:border-rose"
                  title={f.label}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <Step n={1} title="Elige tu vaso">
          <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-2">
            {items.map((i) => (
              <button
                key={i.id}
                onClick={() => chooseBase(i.id)}
                aria-pressed={i.id === base.id}
                className={`rounded-2xl border px-3 py-3 text-left transition-colors ${i.id === base.id ? "border-rose bg-blush" : "border-line hover:border-rose"}`}
              >
                <span className="block font-bold leading-tight">{i.name.replace("Fresas con Crema ", "")}</span>
                <span className="mt-0.5 text-xs text-ink-soft line-clamp-2">{i.desc.replace(/ Con whipped cream\.$/, "")}</span>
              </button>
            ))}
          </div>
        </Step>

        {groups.map((g, gi) => {
          const chosen = inGroup(picks, g);
          const missing = chosen.length < g.min;
          return (
            <Step
              key={g.id}
              n={gi + 2}
              title={g.name}
              hint={
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tried && missing ? "bg-rose text-white" : g.min > 0 ? "bg-blush text-rose" : "bg-cream text-ink-soft border border-line"}`}>
                  {groupHint(g)}
                  {g.max > 1 && ` · ${chosen.length}/${Math.min(g.max, g.choices.length)}`}
                </span>
              }
            >
              <div className="flex flex-wrap gap-2">
                {g.choices
                  .filter((c) => c.available !== false)
                  .map((c) => {
                    const on = chosen.includes(c.id);
                    const full = !on && g.max > 1 && chosen.length >= g.max;
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggle(g, c.id)}
                        disabled={full}
                        aria-pressed={on}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-40 ${
                          on ? "border-rose bg-rose text-white shadow-md" : "border-line bg-white hover:border-rose"
                        }`}
                      >
                        {on && g.max > 1 ? "✓ " : ""}
                        {c.name}
                        {c.price_cents > 0 && <span className={on ? "text-white/85" : "text-rose"}> +{money(c.price_cents / 100)}</span>}
                      </button>
                    );
                  })}
              </div>
            </Step>
          );
        })}

        {tried && problem && (
          <p role="alert" className="mt-2 text-sm text-rose-dark">
            {problem.charAt(0).toUpperCase() + problem.slice(1)}
          </p>
        )}

        {/* Price + add: a bar stuck to the bottom on phones */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto flex max-w-xl items-center gap-3 lg:max-w-none">
            <span className="shrink-0">
              <span className="block text-xs text-ink-soft">Total</span>
              <span className="block text-2xl font-bold text-rose">{money(unit / 100)}</span>
            </span>
            <button onClick={saveFav} aria-label="Guardar como favorito" title="Guardar como favorito" className="shrink-0 rounded-full border border-line bg-white p-3 hover:border-rose">
              <HeartDoodle className="w-5 h-5 text-rose" />
            </button>
            <button onClick={add} className="flex-1 rounded-full bg-rose hover:bg-rose-dark text-white font-bold py-3.5 shadow-md transition-transform active:scale-[0.98]">
              {added ? "¡Agregado! ♥" : "Agregar a mi orden"}
            </button>
          </div>
          {added && (
            <p className="mx-auto mt-2 max-w-xl text-center text-sm lg:max-w-none">
              <Link href="/pedido" className="font-semibold text-rose underline">
                Ver mi orden ({cart.count}) →
              </Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-lg font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-rose text-sm text-white">{n}</span>
          {title}
        </h2>
        {hint}
      </div>
      {children}
    </div>
  );
}
