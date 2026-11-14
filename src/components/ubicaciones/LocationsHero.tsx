"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Wave } from "@/components/Wave";
import { CalendarIcon, PinIcon } from "@/components/icons";

// The Ubicaciones banner: R&X's strawberry splash art, shown whole (no zoom), with
// cream droplets floating over the splash. While scrolling, the art sinks a
// little slower than the page and fades. The tabs under it jump to each part
// of the page and light up for the part on screen.

const TABS = [
  { id: "parada", label: "Parada Actual", icon: TruckIcon },
  { id: "proximas", label: "Próximas Paradas", icon: CalendarIcon },
  { id: "mapa", label: "Ver en el Mapa", icon: PinIcon },
];

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 8h16v14H3zM19 13h6l4 5v4H19z" />
      <circle cx="9" cy="24" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="24" cy="24" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Droplets over the cream splash, as % of the banner
const DROPS = [
  { x: 5, y: 44, s: 10, d: 0 },
  { x: 8.5, y: 37, s: 7, d: -1.5 },
  { x: 23.5, y: 41, s: 9, d: -3 },
  { x: 29, y: 52, s: 6, d: -2 },
  { x: 33.5, y: 63, s: 8, d: -4 },
  { x: 14, y: 33, s: 5, d: -5 },
];

export function LocationsHero() {
  const art = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("parada");

  // Parallax
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 700);
        if (art.current) {
          art.current.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
          art.current.style.opacity = String(1 - y / 1100);
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Which part of the page is on screen
  useEffect(() => {
    const parts = TABS.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: "-35% 0px -50% 0px" },
    );
    parts.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <section className="relative -mt-24 sm:-mt-28 pt-20 sm:pt-24 lg:pt-0 bg-night overflow-hidden">
        <h1 className="sr-only">Nuestras Ubicaciones</h1>
        <div className="relative h-[240px] sm:h-[320px] lg:h-auto lg:w-full lg:aspect-[3/1]">
          <div ref={art} className="absolute inset-0 will-change-transform">
            <div className="absolute inset-0 rx-fade">
              <Image
                src="/images/ubicaciones-banner.webp"
                alt="Nuestras Ubicaciones: fresas con crema de R&X entre un chorro de crema"
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
              <div className="xmas absolute inset-0">
                <Image src="/images/ubicaciones-navidad.webp" alt="" fill priority sizes="100vw" className="object-cover object-center" />
              </div>
              {DROPS.map((d, i) => (
                <span
                  key={i}
                  className="absolute rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,.6)] rx-float hidden sm:block"
                  style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, animationDelay: `${d.d}s` }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
          <p className="hidden lg:block absolute inset-x-0 top-[50%] text-center text-lg xl:text-xl text-white/90 rx-hero-in [animation-delay:.3s]">
            Encuéntranos en nuestras paradas actuales y próximas.
            <br />
            ¡Ven por tus antojos favoritos!
          </p>
          {/* Rolls into the page */}
          <div className="absolute inset-x-0 bottom-0 h-12 sm:h-16 overflow-hidden" aria-hidden>
            <Wave fill="rgba(253,243,239,.55)" top={80} dip={40} className="rx-wave-slow" />
            <Wave fill="var(--cream)" top={110} dip={38} className="rx-wave" />
          </div>
        </div>
      </section>

      <p className="lg:hidden mx-auto max-w-md px-4 pt-2 text-center text-ink-soft">
        Encuéntranos en nuestras paradas actuales y próximas. ¡Ven por tus antojos favoritos!
      </p>

      <nav aria-label="Partes de la página" className="relative z-10 mx-auto max-w-4xl px-4 mt-5 lg:-mt-8 grid grid-cols-3 gap-2 sm:gap-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? "true" : undefined}
            className={`flex items-center justify-center gap-2 sm:gap-3 rounded-full px-2 sm:px-5 py-3 text-sm sm:text-lg font-semibold shadow-md transition-colors ${
              active === id ? "bg-rose text-white shadow-rose/30" : "bg-white text-ink hover:text-rose"
            }`}
          >
            <Icon className="w-5 h-5 sm:w-7 sm:h-7 shrink-0" />
            <span className="leading-tight text-center">{label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}
