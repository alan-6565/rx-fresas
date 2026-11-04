"use client";

import { CLOSING_SOON_MINUTES, formatTime, mapsUrl, pacificMinutes, stopDayLabel, stopsInOrder, type Spot, type Stop } from "@/lib/schedule";
import { useNow } from "@/components/TruckNow";
import { Photo } from "@/components/ui";
import { ArrowRightIcon, CalendarIcon, ClockIcon, PinIcon } from "@/components/icons";

// "Parada Actual" and "Próximas Paradas" from the mockup. Worked out in the
// browser from the weekly hours and re-checked every 30 seconds, so when a
// stop closes the next one takes its place without a reload.

const range = (s: Stop) => `${formatTime(s.start)} – ${formatTime(s.end)}`;

function Status({ stop, now }: { stop: Stop; now: Date }) {
  if (!stop.openNow) return <span className="text-ink-soft">Abre {stop.offset === 0 ? "hoy" : stopDayLabel(stop.offset, now).split(",")[0].toLowerCase()} a las {formatTime(stop.start)}</span>;
  const left = stop.end - pacificMinutes(now);
  if (left <= CLOSING_SOON_MINUTES) return <span className="font-semibold text-amber-700">¡Cerramos en {left} min!</span>;
  return <span>Abierto hasta las {formatTime(stop.end)}</span>;
}

export function CurrentStop({ spots }: { spots: Spot[] }) {
  const now = useNow();
  const [stop] = now ? stopsInOrder(spots, now, 1) : [];

  if (!now) return <div className="min-h-[20rem] rounded-[2rem] bg-white/60 border border-line" />;
  if (!stop)
    return (
      <div className="rounded-[2rem] bg-white border border-line p-8 text-center text-lg text-ink-soft">
        Estamos actualizando nuestro horario. Síguenos en Instagram para ver dónde estaremos. ♡
      </div>
    );

  return (
    <article key={`${stop.spot.id}-${stop.offset}`} className="rx-pop rounded-[2rem] bg-white border border-line shadow-sm p-3 sm:p-4 grid gap-5 md:grid-cols-[1fr_1.25fr] items-stretch">
      <Photo
        slot={`spot:${stop.spot.id}`}
        src={stop.spot.image}
        alt={`R&X en ${stop.spot.name}`}
        className="aspect-[16/11] md:aspect-auto md:min-h-72 rounded-[1.5rem]"
        sizes="(min-width:768px) 40vw, 100vw"
        priority
      />
      <div className="flex flex-col px-2 sm:px-4 py-2 md:py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold ${stop.openNow ? "bg-emerald-50 text-emerald-700" : "bg-blush text-rose"}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${stop.openNow ? "bg-emerald-500 animate-pulse" : "bg-rose"}`} />
            {stop.openNow ? "Parada Actual" : "Próxima Parada"}
          </span>
          <span className="border-b border-line pb-1 text-sm sm:text-base">
            <Status stop={stop} now={now} />
          </span>
        </div>
        <h2 className="mt-5 font-hand text-5xl sm:text-6xl leading-[0.95]">{stop.spot.name}</h2>
        <ul className="mt-5 space-y-3 text-lg">
          <li className="flex items-start gap-3">
            <PinIcon className="w-6 h-6 shrink-0 text-rose mt-0.5" />
            <span>
              {stop.spot.address || stop.spot.name}
              <br />
              {stop.spot.city}
            </span>
          </li>
          <li className="flex flex-wrap gap-x-8 gap-y-3">
            <span className="flex items-center gap-3">
              <ClockIcon className="w-6 h-6 shrink-0 text-rose" /> {range(stop)}
            </span>
            <span className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 shrink-0 text-rose" /> {stopDayLabel(stop.offset, now)}
            </span>
          </li>
        </ul>
        <a
          href={mapsUrl(stop.spot)}
          target="_blank"
          rel="noreferrer"
          className="mt-7 self-start inline-flex items-center justify-center gap-2.5 rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-7 py-3.5 shadow-md shadow-rose/25 transition-colors"
        >
          <PinIcon className="w-5 h-5" /> Cómo llegar en Maps <ArrowRightIcon className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
}

/** The three stops after the current one */
export function NextStops({ spots }: { spots: Spot[] }) {
  const now = useNow();
  const next = now ? stopsInOrder(spots, now, 4).slice(1) : [];

  return (
    <section id="proximas" className="scroll-mt-32 h-full rounded-[2rem] bg-white border border-line shadow-sm p-5 sm:p-7">
      <h2 className="flex items-center gap-3 font-hand text-4xl leading-none">
        <CalendarIcon className="w-9 h-9 text-rose" /> Próximas Paradas
      </h2>
      {!now ? (
        <div className="mt-5 h-48" />
      ) : next.length === 0 ? (
        <p className="mt-5 text-ink-soft">Pronto anunciaremos nuestras próximas paradas. ♡</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {next.map((s) => (
            <li key={`${s.spot.id}-${s.offset}`} className="rx-pop flex items-center gap-4 py-4">
              <CalendarIcon className="w-7 h-7 shrink-0 text-rose" />
              <span className="flex-1 min-w-0">
                <span className="block font-bold">{stopDayLabel(s.offset, now)}</span>
                <span className="block text-ink-soft truncate">
                  {s.spot.name}, {s.spot.city}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-blush px-3 py-1.5 text-sm font-semibold whitespace-nowrap">{range(s)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
