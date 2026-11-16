import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

export type Shelf = { id: string; label: string; image: string; count: number; from: string };

/** Big photo doors into each part of the menu, rising out of the bottom of the hero */
export function MenuShelf({ shelves }: { shelves: Shelf[] }) {
  if (!shelves.length) return null;
  return (
    <section aria-labelledby="shelf-title" className="relative z-20 -mt-28 pb-14 sm:-mt-36 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-4 flex items-end justify-between gap-4 text-white">
          <h2 id="shelf-title" className="text-xs font-semibold uppercase tracking-[0.26em] text-white/75">
            El menú
          </h2>
          <Link href="/menu" className="text-sm font-semibold text-white/85 underline-offset-4 hover:underline">
            Ver todo →
          </Link>
        </div>
        <ul
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 sm:scroll-px-8 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:gap-4 sm:px-8 lg:mx-0 lg:grid lg:gap-5 lg:overflow-visible lg:px-0"
          style={{ gridTemplateColumns: `repeat(${shelves.length}, minmax(0, 1fr))` }}
        >
          {shelves.map((s, i) => (
            <li key={s.id} className="w-[68%] shrink-0 snap-start sm:w-[40%] lg:w-auto">
              <Link
                href={`/menu#${s.id}`}
                className="snowcap group relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-night shadow-[0_28px_50px_-28px_rgba(0,0,0,.7)] ring-1 ring-black/10"
              >
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 22vw, (min-width:640px) 40vw, 68vw"
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/0" />
                <span className="absolute left-5 top-4 font-serif text-lg italic text-white/85">{String(i + 1).padStart(2, "0")}</span>
                <span className="absolute inset-x-5 bottom-5 text-white">
                  <span translate="no" className="notranslate block font-serif text-[1.65rem] font-extrabold leading-[1.05] sm:text-3xl">
                    {s.label}
                  </span>
                  <span className="mt-3 flex items-center justify-between gap-3 text-sm text-white/80">
                    <span>
                      {s.count} {s.count === 1 ? "opción" : "opciones"} · desde {s.from}
                    </span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink transition-colors group-hover:bg-rose group-hover:text-white">
                      <ArrowRightIcon className="h-4 w-4" />
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
