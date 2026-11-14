"use client";

import { useEffect, useRef, useState } from "react";
import { daysToChristmas } from "@/lib/season";

/*
 * Holiday decorations. Everything here sits inside `.xmas` wrappers, which
 * globals.css hides unless <html data-season="navidad">, so they can be placed
 * anywhere and disappear by themselves after the season.
 */

const BULBS = ["#e8364d", "#2fa35b", "#f5c542", "#f6f1e8", "#3a8de0"];
/** Round so the server and the browser print identical numbers (no hydration warning) */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** A sagging wire of glowing Christmas bulbs that twinkle in turn. Stretches to its box. */
export function Lights({ count = 18, className = "" }: { count?: number; className?: string }) {
  const W = 1000;
  const sag = 26;
  const pts = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    // a couple of swags across the width, like real lights hung on hooks
    const swag = Math.sin(t * Math.PI * 3) ** 2;
    return { x: r2(t * W), y: r2(8 + swag * sag) };
  });
  const wire = `M0 8 ${Array.from({ length: 31 }, (_, i) => {
    const t = i / 30;
    return `L${r2(t * W)} ${r2(8 + Math.sin(t * Math.PI * 3) ** 2 * sag)}`;
  }).join(" ")}`;
  return (
    <svg viewBox={`0 0 ${W} 60`} preserveAspectRatio="none" className={`xmas pointer-events-none ${className}`} aria-hidden>
      <path d={wire} fill="none" stroke="#2c3a2e" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
      {pts.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <rect x="-3.5" y="0" width="7" height="6" rx="1.5" fill="#3d4a3f" />
          <ellipse
            className="bulb"
            cx="0"
            cy="15"
            rx="6.5"
            ry="10"
            fill={BULBS[i % BULBS.length]}
            style={{ ["--glow" as string]: BULBS[i % BULBS.length], animationDelay: `${(i * 0.37) % 2.4}s` }}
          />
        </g>
      ))}
    </svg>
  );
}

/** Gentle snowfall over the whole page. Skipped with reduced motion; pauses when the tab is hidden. */
export function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (document.documentElement.dataset.season !== "navidad") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let W = 0;
    let H = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      W = innerWidth;
      H = innerHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener("resize", resize);
    const n = innerWidth < 640 ? 45 : 90;
    const flakes = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2.6,
      s: 0.3 + Math.random() * 0.8,
      w: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      for (const f of flakes) {
        f.y += f.s;
        f.w += 0.012;
        f.x += Math.sin(f.w) * 0.35;
        if (f.y > H + 5) {
          f.y = -5;
          f.x = Math.random() * W;
        }
        ctx.globalAlpha = 0.45 + f.r / 6;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };
    vis();
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);
  return <canvas ref={ref} className="xmas pointer-events-none fixed inset-0 z-30 h-full w-full" aria-hidden />;
}

/** A floppy Santa hat, for the round logo */
export function SantaHat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" className={`xmas pointer-events-none ${className}`} aria-hidden>
      <path d="M12 62 C20 30 46 6 74 10 C88 12 94 26 90 44 C86 36 80 30 72 30 C60 34 50 50 46 62 Z" fill="#d9283e" />
      <path d="M72 30 C80 30 86 36 90 44 C92 40 92 34 90 28" fill="#b31b30" />
      <rect x="4" y="56" width="58" height="16" rx="8" fill="#fbf7f2" transform="rotate(-8 33 64)" />
      <circle cx="90" cy="48" r="9" fill="#fbf7f2" />
    </svg>
  );
}

/** Holly leaves and berries, swapped in for the heart doodle next to headings */
export function Holly({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 50" className={`xmas ${className}`} aria-hidden>
      <path d="M30 26 C22 14 10 18 4 10 C8 20 2 24 6 30 C12 26 20 32 30 26 Z" fill="#2f8a4c" />
      <path d="M30 26 C38 14 50 18 56 10 C52 20 58 24 54 30 C48 26 40 32 30 26 Z" fill="#257a41" />
      <circle cx="26" cy="30" r="5" fill="#d9283e" />
      <circle cx="34" cy="31" r="5" fill="#e8364d" />
      <circle cx="30" cy="24" r="5" fill="#c41f35" />
    </svg>
  );
}

/** "Faltan 41 días para Navidad", counted in Pacific time on the visitor's device */
export function Countdown({ className = "" }: { className?: string }) {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDays(daysToChristmas()));
    return () => cancelAnimationFrame(id);
  }, []);
  if (days === null) return <span className={`xmas ${className}`}>&nbsp;</span>;
  const text = days === 0 ? "¡Feliz Navidad!" : days === 1 ? "¡Mañana es Navidad!" : days > 300 ? "¡Felices Fiestas!" : `Faltan ${days} días para Navidad`;
  return <span className={`xmas ${className}`}>{text}</span>;
}

const BAUBLES = [
  { side: "left", at: "14px", len: 70, size: 30, color: "#d9283e", delay: 0 },
  { side: "left", at: "44px", len: 130, size: 24, color: "#f5c542", delay: 0.6 },
  { side: "left", at: "66px", len: 40, size: 20, color: "#2f8a4c", delay: 1.1 },
  { side: "right", at: "16px", len: 110, size: 30, color: "#2f8a4c", delay: 0.3 },
  { side: "right", at: "44px", len: 55, size: 24, color: "#d9283e", delay: 0.9 },
  { side: "right", at: "66px", len: 150, size: 20, color: "#f5c542", delay: 1.4 },
] as const;

/** Shiny baubles dangling from the top of the page at both edges, swaying a little.
 *  Only on wide screens, where they hang in the empty margin beside the content. */
export function Ornaments() {
  return (
    <div className="xmas pointer-events-none absolute inset-x-0 top-0 z-20 hidden h-0 min-[1400px]:block" aria-hidden>
      {BAUBLES.map((b, i) => (
        <div
          key={i}
          className="ornament absolute top-24"
          style={{ [b.side]: b.at, animationDelay: `${b.delay}s` } as React.CSSProperties}
        >
          <div className="mx-auto w-px bg-[#c9a24a]" style={{ height: b.len }} />
          <svg viewBox="0 0 40 46" style={{ width: b.size }} className="-mt-px drop-shadow-[0_6px_8px_rgba(0,0,0,0.25)]">
            <rect x="15" y="0" width="10" height="7" rx="2" fill="#c9a24a" />
            <circle cx="20" cy="26" r="18" fill={b.color} />
            <ellipse cx="13" cy="19" rx="5" ry="7" fill="#fff" opacity="0.45" transform="rotate(-25 13 19)" />
            <path d="M3 26 Q20 33 37 26" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" fill="none" />
          </svg>
        </div>
      ))}
    </div>
  );
}

/** A red satin bow sitting on the top edge of a card, like a wrapped gift */
export function GiftRibbon() {
  return (
    <div className="xmas pointer-events-none absolute left-1/2 -top-6 z-10 -translate-x-1/2" aria-hidden>
      <svg viewBox="0 0 80 50" className="w-20 drop-shadow-md">
        <path d="M40 24 C24 4 6 6 8 18 C10 30 30 28 40 24 Z" fill="#e8364d" />
        <path d="M40 24 C56 4 74 6 72 18 C70 30 50 28 40 24 Z" fill="#d9283e" />
        <path d="M38 26 L28 48 L36 44 L40 30 Z M42 26 L52 48 L44 44 L40 30 Z" fill="#b31b30" />
        <circle cx="40" cy="25" r="6" fill="#b31b30" />
      </svg>
    </div>
  );
}

/** A one-time flurry of snowflakes, for the thank-you page */
export function Flurry({ count = 36 }: { count?: number }) {
  const [flakes, setFlakes] = useState<{ left: number; size: number; dur: number; delay: number }[]>([]);
  useEffect(() => {
    if (document.documentElement.dataset.season !== "navidad") return;
    const id = requestAnimationFrame(() =>
      setFlakes(Array.from({ length: count }, () => ({ left: Math.random() * 100, size: 10 + Math.random() * 16, dur: 4 + Math.random() * 4, delay: Math.random() * 2.5 }))),
    );
    return () => cancelAnimationFrame(id);
  }, [count]);
  return (
    <div className="xmas" aria-hidden>
      {flakes.map((f, i) => (
        <span key={i} className="flake text-white drop-shadow-[0_0_4px_rgba(140,42,60,0.6)]" style={{ left: `${f.left}%`, fontSize: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}>
          ❄
        </span>
      ))}
    </div>
  );
}

/** Tiny burst of stars and snowflakes from a button (only in season) */
export function Sparkles() {
  const bits = ["✦", "❄", "✦", "★", "❄", "✦"];
  return (
    <span className="xmas" aria-hidden>
      {bits.map((b, i) => {
        const a = (i / bits.length) * Math.PI * 2;
        return (
          <span key={i} className="sparkle text-sm" style={{ ["--dx" as string]: `${Math.round(Math.cos(a) * 34)}px`, ["--dy" as string]: `${Math.round(Math.sin(a) * 26)}px`, color: i % 2 ? "#2f8a4c" : "#e8364d" }}>
            {b}
          </span>
        );
      })}
    </span>
  );
}
