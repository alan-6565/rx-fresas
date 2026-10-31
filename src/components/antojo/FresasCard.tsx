"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { Item } from "@/lib/data";
import { money } from "@/lib/data";
import { BuilderSheet } from "@/components/antojo/BuilderSheet";

/**
 * All the fresas con crema styles as one menu card. The photo cycles through
 * the styles; ordering opens the builder, where they pick theirs.
 */
export function FresasCard({ cups, autoOpen }: { cups: Item[]; autoOpen?: boolean }) {
  const [shown, setShown] = useState(0);
  const [open, setOpen] = useState(!!autoOpen);
  const from = Math.min(...cups.map((c) => c.price));
  const names = cups.map((c) => c.name.replace(/^Fresas con Crema\s*/, "") || "Original");

  useEffect(() => {
    if (cups.length < 2) return;
    const t = setInterval(() => setShown((n) => (n + 1) % cups.length), 2600);
    return () => clearInterval(t);
  }, [cups.length]);

  return (
    <>
      <article className="md:col-span-2 grid overflow-hidden rounded-3xl border border-line bg-white shadow-sm sm:grid-cols-[minmax(0,1fr)_1.2fr]">
        <button type="button" onClick={() => setOpen(true)} className="relative aspect-[4/3] sm:aspect-auto sm:min-h-72 bg-blush" aria-label="Ordenar fresas con crema">
          {cups.map((c, i) => (
            <Image key={c.id} src={c.image} alt={c.name} fill sizes="(min-width: 640px) 45vw, 100vw" className={`object-cover transition-opacity duration-700 ${i === shown ? "opacity-100" : "opacity-0"}`} />
          ))}
          <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-sm font-bold shadow">{names[shown]}</span>
        </button>
        <div className="flex flex-col justify-center p-5 sm:p-8">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-hand text-4xl leading-none">Fresas con Crema</h3>
            <span className="shrink-0 font-bold text-rose">Desde {money(from)}</span>
          </div>
          <p className="mt-2 text-ink-soft">Elige tu estilo, tamaño, crema, drizzles y toppings, y mira cómo queda tu vaso antes de pedirlo.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {cups.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onMouseEnter={() => setShown(i)}
                onClick={() => setShown(i)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${i === shown ? "border-rose bg-blush text-rose" : "border-line text-ink-soft"}`}
              >
                {names[i]}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setOpen(true)} className="mt-6 self-start rounded-full bg-rose px-7 py-3 font-bold text-white shadow-md hover:bg-rose-dark">
            Ordenar ahora →
          </button>
        </div>
      </article>
      {open && <BuilderSheet initialId={cups[shown]?.id} onClose={() => setOpen(false)} />}
    </>
  );
}
