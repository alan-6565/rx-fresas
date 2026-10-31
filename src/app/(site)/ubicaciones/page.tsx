import type { Metadata } from "next";
import { getSpots } from "@/lib/catalog";
import { hoursSummary, mapsUrl } from "@/lib/schedule";
import { OpenBadge } from "@/components/OpenBadge";
import { TruckNow } from "@/components/TruckNow";
import { Button, Heading, PageTop, Photo } from "@/components/ui";
import { ContactLinks } from "@/components/ContactLinks";
import { ClockIcon, PinIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Ubicaciones — R&X Fresas con Crema" };

export default async function LocationsPage() {
  const spots = await getSpots();
  return (
    <PageTop>
      <div className="text-center">
        <Heading as="h1" sub="¡Ven por tu antojo favorito! ♥">
          Nuestras Ubicaciones
        </Heading>
      </div>

      <TruckNow spots={spots} className="mt-8 mx-auto max-w-3xl" />

      <div className="mt-8 grid md:grid-cols-2 gap-8">
        {spots.map((l, i) => (
          <article key={l.id} className="rounded-[2rem] bg-white border border-line shadow-sm overflow-hidden">
            <Photo src={l.image} alt={`Food truck en ${l.name}`} className="aspect-[2.2/1]" priority={i === 0} />
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-2xl font-bold">
                  <PinIcon className="w-7 h-7 text-rose" /> {l.name}
                </h2>
                <OpenBadge spot={l} />
              </div>
              <p className="ml-9 text-ink-soft">{l.address || l.city}</p>
              {hoursSummary(l.hours).map((h) => (
                <p key={h} className="ml-9 mt-2 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 shrink-0" /> {h}
                </p>
              ))}
              <Button href={mapsUrl(l)} className="mt-5 w-full">
                Cómo llegar
              </Button>
            </div>
          </article>
        ))}
      </div>

      <section className="mt-20 grid lg:grid-cols-2 gap-10 items-center">
        <Heading sub="¿Tienes preguntas o quieres que vayamos a un evento? ¡Escríbenos!">Contacto</Heading>
        <ContactLinks />
      </section>
    </PageTop>
  );
}
