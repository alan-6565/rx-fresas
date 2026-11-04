import type { Metadata } from "next";
import { getSpots } from "@/lib/catalog";
import { CurrentStop, NextStops } from "@/components/StopCards";
import { SpotsMap } from "@/components/SpotsMap";
import { LocationsHero } from "@/components/ubicaciones/LocationsHero";
import { Reveal } from "@/components/Reveal";
import { PinIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Ubicaciones — R&X Fresas con Crema" };

export default async function LocationsPage() {
  const spots = await getSpots();
  const pinned = spots.filter((s) => s.lat != null && s.lng != null);

  return (
    <div className="overflow-x-clip">
      <LocationsHero />

      <div className="mx-auto max-w-7xl px-4 sm:px-8 mt-8">
        <div id="parada" className="scroll-mt-32">
          <CurrentStop spots={spots} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] items-stretch">
          <Reveal className="h-full">
            <section id="mapa" className="scroll-mt-32 h-full rounded-[2rem] bg-white border border-line shadow-sm p-5 sm:p-6 flex flex-col">
              <h2 className="flex items-center gap-3 font-hand text-4xl leading-none">
                <PinIcon className="w-8 h-8 text-rose" /> Nuestra Ubicación
              </h2>
              {pinned.length > 0 ? (
                <SpotsMap spots={pinned} className="mt-4 flex-1 min-h-72 rounded-2xl overflow-hidden" />
              ) : (
                <p className="mt-4 flex-1 text-ink-soft">Pronto.</p>
              )}
            </section>
          </Reveal>
          <Reveal delay={120} className="h-full">
            <NextStops spots={spots} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}
