"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { CupIcon, HeartDoodle, PancakeIcon, StrawberryIcon } from "@/components/icons";

// "Nuestro Menú" banner on the strawberry-cream swirl. While scrolling, the
// photo drifts slower than the page and the title floats up and fades
// (parallax); it also zooms very slowly on its own.

const features = [
  { icon: CupIcon, label: "Café frío y caliente" },
  { icon: StrawberryIcon, label: "Fresas con Crema" },
  { icon: PancakeIcon, label: "Mini Pancakes" },
];

export function MenuHero() {
  const bg = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.min(window.scrollY, 700);
      if (bg.current) bg.current.style.transform = `translate3d(0, ${y * 0.4}px, 0) scale(${1 + y * 0.0003})`;
      if (text.current) {
        text.current.style.transform = `translate3d(0, ${y * -0.12}px, 0)`;
        text.current.style.opacity = String(Math.max(0, 1 - y / 520));
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="relative -mt-24 sm:-mt-28 overflow-hidden">
      <div ref={bg} className="absolute inset-0 will-change-transform">
        <div className="rx-drift absolute inset-0">
          <Image src="/images/menu-swirl.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        </div>
      </div>
      {/* Soft cream glow behind the words, and a fade into the page below */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(253,243,241,0.82)_0%,rgba(253,243,241,0.45)_45%,rgba(253,243,241,0)_75%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-cream" />

      <div ref={text} className="relative mx-auto flex min-h-[460px] max-w-4xl flex-col items-center justify-center px-4 pb-20 pt-32 text-center sm:min-h-[540px] sm:pt-36 will-change-transform">
        <h1 className="rx-hero-in flex items-start gap-2 font-hand text-7xl leading-none text-ink drop-shadow-[0_2px_12px_rgba(253,243,241,0.9)] sm:text-9xl">
          Nuestro Menú
          <HeartDoodle className="mt-1 w-10 h-10 shrink-0 rotate-12 text-rose sm:w-16 sm:h-16" />
        </h1>
        <svg viewBox="0 0 300 16" className="rx-draw -mt-1 w-56 text-rose sm:w-80" aria-hidden>
          <path d="M4 11C70 3 150 2 296 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        </svg>
        <p className="rx-hero-in mt-4 text-lg font-medium text-ink sm:text-xl [animation-delay:120ms]">Bebidas, antojos y favoritos para cada momento.</p>
        <ul className="rx-hero-in mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-full bg-white/55 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm sm:gap-x-0 sm:divide-x sm:divide-ink/20 sm:text-base [animation-delay:240ms]">
          {features.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 sm:px-6">
              <Icon className="w-6 h-6 text-rose" /> {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
