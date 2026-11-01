"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isRunning, pacificToday, type Promotion } from "@/lib/promotions";

// Promotions on the website. Dates are checked in the browser, so a promo
// starts and ends on the right day even though the pages are pre-built.

function Go({ p, className }: { p: Promotion; className: string }) {
  if (!p.href || !p.cta) return null;
  return p.href.startsWith("/") ? (
    <Link href={p.href} className={className}>
      {p.cta} →
    </Link>
  ) : (
    <a href={p.href} target="_blank" rel="noopener noreferrer" className={className}>
      {p.cta} →
    </a>
  );
}

/** Runs after load: what's live today (empty on the server, so nothing flashes wrong) */
function useRunning(list: Promotion[], where: "banner" | "homeCard") {
  const [shown, setShown] = useState<Promotion[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      const today = pacificToday();
      setShown(list.filter((p) => p[where] && isRunning(p, today)));
    }, 0);
    return () => clearTimeout(t);
  }, [list, where]);
  return [shown, setShown] as const;
}

const HIDE_KEY = "rx-promo-cerradas";

/** Thin bar above the navbar; the ✕ hides that promo on this device */
export function PromoBar({ promotions }: { promotions: Promotion[] }) {
  const [running] = useRunning(promotions, "banner");
  const [closed, setClosed] = useState<string[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setClosed(JSON.parse(sessionStorage.getItem(HIDE_KEY) ?? "[]"));
      } catch {
        setClosed([]);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const p = closed ? running.find((r) => !closed.includes(r.id)) : undefined;
  if (!p) return null;

  const close = () => {
    const next = [...(closed ?? []), p.id];
    setClosed(next);
    try {
      sessionStorage.setItem(HIDE_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="relative z-50 bg-rose text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-x-3 gap-y-1 px-10 py-2 text-center text-sm flex-wrap">
        <span>
          <strong>{p.title}</strong>
          {p.message && <span className="text-white/90"> · {p.message}</span>}
        </span>
        <Go p={p} className="shrink-0 rounded-full bg-white px-3 py-0.5 text-xs font-bold text-rose hover:bg-cream" />
      </div>
      <button onClick={close} aria-label="Cerrar aviso" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 hover:text-white">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/** Big cards on the home page */
export function HomePromos({ promotions }: { promotions: Promotion[] }) {
  const [running] = useRunning(promotions, "homeCard");
  if (!running.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-8 pt-16 grid gap-6 lg:grid-cols-2">
      {running.slice(0, 2).map((p) => (
        <article
          key={p.id}
          className={`rx-hero-in relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blush to-cream border border-line shadow-[0_10px_30px_rgba(232,80,106,0.12)] ${running.length === 1 ? "lg:col-span-2" : ""}`}
        >
          <div className={`grid h-full ${p.image ? "sm:grid-cols-[1.1fr_1fr]" : ""}`}>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <span className="self-start rounded-full bg-rose px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Promoción</span>
              <h2 className="mt-3 font-hand text-5xl leading-none text-ink">{p.title}</h2>
              {p.message && <p className="mt-3 text-lg text-ink-soft">{p.message}</p>}
              {p.end && <p className="mt-2 text-sm font-semibold text-rose">Hasta el {new Date(`${p.end}T12:00:00`).toLocaleDateString("es-US", { day: "numeric", month: "long" })}</p>}
              <Go p={p} className="mt-5 self-start rounded-full bg-rose px-6 py-3 font-bold text-white shadow-md hover:bg-rose-dark" />
            </div>
            {p.image && (
              <div className="relative min-h-56">
                <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
