"use client";

import { useEffect, useRef, useState } from "react";

/*
 * The bigger holiday moments. Like Decor.tsx, everything is inside `.xmas`
 * so it only shows while <html data-season="navidad">.
 */

const BULB_COLORS = ["#ff3b4f", "#3ddc84", "#ffd23f", "#ffffff", "#4aa8ff"];

/**
 * First visit of the session: the screen is dark, a string of lights switches
 * on bulb by bulb, "¡Felices Fiestas!" glows, then the page opens in a circle.
 * The <head> script sets html[data-intro] before paint so the page never
 * flashes first. Tap anywhere to skip. ?intro=1 replays it.
 */
export function IntroCurtain() {
  const [phase, setPhase] = useState<"lit" | "open" | "done">("lit");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    if (!html.hasAttribute("data-intro")) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      html.removeAttribute("data-intro");
      try {
        sessionStorage.setItem("rx-intro", "1");
      } catch {}
      setPhase("done");
    };
    if (reduce) return finish();
    const t1 = setTimeout(() => setPhase("open"), 2300);
    const t2 = setTimeout(finish, 3300);
    const skip = () => {
      clearTimeout(t1);
      clearTimeout(t2);
      setPhase("open");
      setTimeout(finish, 700);
    };
    const el = ref.current;
    el?.addEventListener("pointerdown", skip, { once: true });
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      el?.removeEventListener("pointerdown", skip);
    };
  }, []);

  if (phase === "done") return null;
  const n = 14;
  // two swags of wire; bulbs hang on the same curve
  const yAt = (t: number) => Math.round(14 + 42 * Math.sin(Math.PI * 2 * t) ** 2);
  const wire = "M0 14 " + Array.from({ length: 41 }, (_, i) => `L${i * 25} ${yAt(i / 40)}`).join(" ");
  return (
    <div ref={ref} className={`intro-curtain xmas fixed inset-0 z-[100] grid place-items-center bg-[#0b1611] text-white ${phase === "open" ? "intro-open" : ""}`} aria-hidden>
      <div className="w-full max-w-3xl px-6 text-center">
        <svg viewBox="0 0 1000 90" className="w-full overflow-visible">
          <path d={wire} fill="none" stroke="#24382b" strokeWidth="3" />
          {Array.from({ length: n }, (_, i) => {
            const t = (i + 0.5) / n;
            const x = t * 1000;
            const y = yAt(t);
            const c = BULB_COLORS[i % BULB_COLORS.length];
            return (
              <g key={i} transform={`translate(${Math.round(x)} ${Math.round(y)})`}>
                <rect x="-5" y="-2" width="10" height="9" rx="2" fill="#2c3a2e" />
                <ellipse className="intro-bulb" cx="0" cy="20" rx="9" ry="14" fill={c} style={{ ["--glow" as string]: c, animationDelay: `${0.15 + i * 0.08}s` }} />
              </g>
            );
          })}
        </svg>
        <p className="intro-title mt-6 font-script text-6xl sm:text-8xl text-[#ffd9de]">¡Felices Fiestas!</p>
        <p className="intro-sub mt-3 text-sm sm:text-base tracking-[0.3em] uppercase text-white/70">R&amp;X Fresas con Crema</p>
      </div>
    </div>
  );
}

/** Little snowflakes trail the mouse on desktop; a tap on a phone shakes loose a small burst */
export function SnowTrail() {
  useEffect(() => {
    if (document.documentElement.dataset.season !== "navidad") return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.createElement("div");
    layer.className = "pointer-events-none fixed inset-0 z-[60] overflow-hidden";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    let last = 0;
    const flake = (x: number, y: number, big = false) => {
      const s = document.createElement("span");
      s.textContent = Math.random() > 0.5 ? "❄" : "✦";
      s.className = "trail-flake";
      s.style.left = `${x}px`;
      s.style.top = `${y}px`;
      s.style.fontSize = `${(big ? 12 : 8) + Math.random() * 8}px`;
      s.style.setProperty("--dx", `${(Math.random() - 0.5) * (big ? 120 : 40)}px`);
      s.style.setProperty("--dy", `${(big ? 40 : 30) + Math.random() * 60}px`);
      s.style.color = Math.random() > 0.8 ? "#ffd23f" : "#ffffff";
      layer.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    };
    const fine = matchMedia("(pointer: fine)").matches;
    const move = (e: PointerEvent) => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      flake(e.clientX, e.clientY);
    };
    const tap = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      for (let i = 0; i < 8; i++) flake(e.clientX, e.clientY, true);
    };
    if (fine) addEventListener("pointermove", move, { passive: true });
    addEventListener("pointerdown", tap, { passive: true });
    return () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", tap);
      layer.remove();
    };
  }, []);
  return null;
}

/** A soft drift of snow along the bottom of a dark section, melting into the page below */
export function Snowdrift({ className = "", fill = "var(--cream)" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className={`xmas pointer-events-none absolute inset-x-0 bottom-0 h-12 w-full sm:h-16 ${className}`} aria-hidden>
      <path d="M0 60 C120 30 220 70 340 48 C470 24 560 66 700 50 C840 34 930 70 1060 46 C1190 22 1300 62 1440 40 V90 H0 Z" fill="#ffffff" opacity="0.55" />
      <path d="M0 70 C150 48 260 82 400 62 C540 42 640 80 780 64 C920 48 1030 84 1170 62 C1290 44 1370 70 1440 60 V90 H0 Z" fill={fill} />
    </svg>
  );
}

/** Winter night over the footer: stars, snowy hills and pine trees, with a few lit windows */
export function WinterNight() {
  const stars = [
    [80, 30], [210, 14], [330, 40], [470, 20], [610, 36], [760, 12], [880, 34], [1010, 18], [1150, 38], [1290, 16], [1390, 32], [540, 52], [1220, 56],
  ];
  const trees = [60, 140, 250, 1180, 1270, 1360];
  return (
    <svg viewBox="0 0 1440 170" preserveAspectRatio="xMidYMax slice" className="xmas pointer-events-none block h-28 w-full sm:h-40" aria-hidden>
      {stars.map(([x, y], i) => (
        <circle key={i} className="star" cx={x} cy={y} r={i % 3 ? 1.4 : 2.2} fill="#fff" style={{ animationDelay: `${(i * 0.43) % 3}s` }} />
      ))}
      <path d="M0 120 C200 80 380 110 560 92 C760 72 940 112 1120 90 C1260 74 1360 96 1440 88 V170 H0 Z" fill="#1d3a2b" />
      {trees.map((x, i) => (
        <g key={x} transform={`translate(${x} ${i < 3 ? 104 - i * 4 : 90 + (i - 3) * 3}) scale(${0.9 + (i % 2) * 0.35})`}>
          <path d="M0 -60 L22 -18 L12 -18 L30 10 L-30 10 L-12 -18 L-22 -18 Z" fill="#0f2a1c" />
          <path d="M0 -60 L10 -40 L-10 -40 Z M-14 -22 L14 -22 L8 -14 L-8 -14 Z" fill="#ffffff" opacity="0.8" />
          <rect x="-3" y="10" width="6" height="8" fill="#3b2a1e" />
        </g>
      ))}
      {/* a little house with warm windows */}
      <g transform="translate(700 92)">
        <path d="M-40 0 L0 -32 L40 0 Z" fill="#ffffff" />
        <rect x="-32" y="0" width="64" height="38" fill="#2b2320" />
        <rect className="window" x="-22" y="10" width="14" height="12" fill="#ffd27a" />
        <rect className="window" x="8" y="10" width="14" height="12" fill="#ffd27a" style={{ animationDelay: "1.3s" }} />
      </g>
      {/* front ground in the footer's color, with a line of snow along its edge */}
      <path d="M0 140 C220 112 420 138 640 124 C880 108 1080 142 1300 122 C1370 116 1410 124 1440 120 V170 H0 Z" fill="var(--night)" />
      <path d="M0 140 C220 112 420 138 640 124 C880 108 1080 142 1300 122 C1370 116 1410 124 1440 120" fill="none" stroke="#f4f1ee" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
