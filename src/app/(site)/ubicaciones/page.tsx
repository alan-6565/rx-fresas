import type { Metadata } from "next";
import { locations } from "@/lib/data";
import { Button, Heading, PageTop, Photo } from "@/components/ui";
import { ContactLinks } from "@/components/ContactLinks";
import { ClockIcon, PinIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Ubicaciones — R&X Fresas con Crema" };

export default function LocationsPage() {
  return (
    <PageTop>
      <div className="text-center">
        <Heading as="h1" sub="¡Ven por tu antojo favorito! ♥">
          Nuestras Ubicaciones
        </Heading>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-8">
        {locations.map((l, i) => (
          <article key={l.name} className="rounded-[2rem] bg-white border border-line shadow-sm overflow-hidden">
            <Photo src={l.image} alt={`Food truck en ${l.name}`} className="aspect-[2.2/1]" priority={i === 0} />
            <div className="p-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <PinIcon className="w-7 h-7 text-rose" /> {l.name}
              </h2>
              <p className="ml-9 text-ink-soft">{l.city}</p>
              <p className="ml-9 mt-2 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" /> {l.hours}
              </p>
              <Button href={l.mapsUrl} className="mt-5 w-full">
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
