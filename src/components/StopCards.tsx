"use client";

import { CLOSING_SOON_MINUTES, formatTime, mapsUrl, stopDayLabel, upcomingStops, type Spot, type Stop } from "@/lib/schedule";
import { useNow } from "@/components/TruckNow";
import { Photo } from "@/components/ui";
import { ArrowRightIcon, CalendarIcon, ClockIcon, PinIcon } from "@/components/icons";

// "Estamos aquí ahora" + "Próxima parada" from the mockup. Worked out in the
// browser from the weekly hours, so it changes over on its own at closing time.

function Details({ stop, now, big }: { stop: Stop; now: Date; big?: boolean }) {
  const row = `flex items-start gap-3 ${big ? "text-lg" : ""}`;
  const icon = `${big ? "w-6 h-6" : "w-5 h-5"} shrink-0 text-rose mt-0.5`;
  return (
    <ul className={`space-y-2.5 ${big ? "mt-4" : "mt-3"}`}>
      <li className={row}>
        <PinIcon className={icon} />
        <span>
          {stop.spot.address || stop.spot.name}
          <br />
          <span className="text-ink-soft">{stop.spot.city}</span>
        </span>
      </li>
      <li className={row}>
        <ClockIcon className={icon} /> {formatTime(stop.start)} – {formatTime(stop.end)}
      </li>
      <li className={row}>
        <CalendarIcon className={icon} /> {stopDayLabel(stop.offset, now)}
      </li>
    </ul>
  );
}

function minutesNow(now: Date) {
  const [h, m] = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "numeric", hourCycle: "h23" }).format(now).split(":").map(Number);
  return h * 60 + m;
}

export function StopCards({ spots }: { spots: Spot[] }) {
  const now = useNow();
  const [first, second] = now ? upcomingStops(spots, now, 2) : [];

  if (!now) return <div className="mt-10 min-h-[22rem] rounded-[2rem] bg-white/60 border border-line" />;
  if (!first)
    return (
      <div className="mt-10 rounded-[2rem] bg-white border border-line p-8 text-center text-lg text-ink-soft">
        Estamos actualizando nuestro horario. Síguenos en Instagram para ver dónde estaremos. ♡
      </div>
    );

  const left = minutesNow(now);
  const closingSoon = first.openNow && first.end - left <= CLOSING_SOON_MINUTES;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.85fr_1fr]">
      {/* Where the truck is now (or will be first) */}
      <article className="rounded-[2rem] bg-white border border-line shadow-sm p-4 sm:p-5 grid gap-5 md:grid-cols-[1fr_1.15fr] items-stretch">
        <div className="flex flex-col p-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-blush px-4 py-2 text-sm font-bold uppercase tracking-wide text-rose">
              <PinIcon className="w-5 h-5" />
              {first.openNow ? "Estamos aquí ahora" : "Próxima parada"}
            </span>
            {first.openNow ? (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${closingSoon ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}
              >
                <span className={`w-2 h-2 rounded-full ${closingSoon ? "bg-amber-500" : "bg-emerald-500"}`} />
                {closingSoon ? `Cierra en ${first.end - left} min` : "Abierto"}
              </span>
            ) : (
              <span className="rounded-full bg-[#f6eeec] px-3 py-1.5 text-sm font-semibold text-ink-soft">Abre a las {formatTime(first.start)}</span>
            )}
          </div>
          <h2 className="mt-4 font-hand text-4xl sm:text-5xl leading-[0.95]">{first.spot.name}</h2>
          <Details stop={first} now={now} big />
          <a
            href={mapsUrl(first.spot)}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center justify-center gap-2.5 rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-7 py-3 shadow-md md:mt-auto"
          >
            <PinIcon className="w-5 h-5" /> Cómo llegar <ArrowRightIcon className="w-4 h-4" />
          </a>
        </div>
        <Photo slot={`spot:${first.spot.id}`} src={first.spot.image} alt={`El food truck en ${first.spot.name}`} className="aspect-[16/10] md:aspect-auto md:min-h-64 rounded-[1.5rem]" sizes="(min-width:1024px) 34vw, 100vw" priority />
      </article>

      {/* The stop after that */}
      {second && (
        <article className="rounded-[2rem] bg-white border border-line shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-3 rounded-2xl bg-blush px-4 py-3">
            <ClockIcon className="w-8 h-8 shrink-0 text-ink" />
            <span>
              <span className="block font-bold uppercase tracking-wide">{first.openNow ? "Próxima parada" : "Después"}</span>
              <span className="block text-ink-soft">
                Abre {second.offset === 0 ? "" : second.offset === 1 ? "mañana " : `el ${stopDayLabel(second.offset, now).split(" ")[0].toLowerCase()} `}a las {formatTime(second.start)}
              </span>
            </span>
          </div>
          <div className="mt-4 grid gap-4 grid-cols-[1fr_auto] sm:grid-cols-[1fr_9rem] lg:grid-cols-1 xl:grid-cols-[1fr_8.5rem] items-start px-1">
            <div>
              <h2 className="font-hand text-3xl sm:text-4xl leading-none">{second.spot.name}</h2>
              <Details stop={second} now={now} />
            </div>
            <Photo slot={`spot:${second.spot.id}`} src={second.spot.image} alt={`El food truck en ${second.spot.name}`} className="hidden sm:block lg:hidden xl:block aspect-square rounded-2xl" sizes="144px" />
          </div>
        </article>
      )}
    </div>
  );
}

/** One "Ver en Google Maps" button for whichever stop is current (or next); switches at closing time */
export function CurrentStopMapButton({ spots }: { spots: Spot[] }) {
  const now = useNow();
  const [stop] = now ? upcomingStops(spots, now, 1) : [];
  if (!stop) return null;
  return (
    <a
      href={mapsUrl(stop.spot)}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-5 py-3 shadow-md"
    >
      <PinIcon className="w-5 h-5 shrink-0" />
      Ver {stop.spot.name} en Google Maps
      <ArrowRightIcon className="w-4 h-4 shrink-0" />
    </a>
  );
}
