import Link from "next/link";
import type { Metadata } from "next";
import { getMenu, getSpots } from "@/lib/catalog";
import { PageTop, Photo } from "@/components/ui";
import { CurrentStopMapButton, StopCards } from "@/components/StopCards";
import { SpotsMap } from "@/components/SpotsMap";
import { ArrowRightIcon, CupIcon, HeartDoodle, PancakeIcon, PinIcon, StrawberryIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Ubicaciones — R&X Fresas con Crema" };

// "The Dubai (12 oz)" → "The Dubai"; sizes and counts are picked on the menu
const shortName = (name: string) => name.replace(/\s*\(\d+\s*(oz|ct)\)\s*$/i, "").replace(/^Fresas con Crema · /, "Fresas con Crema ");

const perks = [
  { icon: StrawberryIcon, title: "Ingredientes Frescos", sub: "Siempre la mejor calidad" },
  { icon: CupIcon, title: "Café Frío y Caliente", sub: "Para cualquier momento" },
  { icon: PancakeIcon, title: "Mini Pancakes", sub: "Personaliza tus toppings" },
  { icon: HeartDoodle, title: "Nos encanta nuestra comunidad", sub: "Gracias por su apoyo" },
];

export default async function LocationsPage() {
  const [spots, { items }] = await Promise.all([getSpots(), getMenu()]);
  // One card per photo, in menu order: the house favorites come first
  const popular = items.filter((item, i, list) => list.findIndex((x) => x.image === item.image) === i).slice(0, 4);
  const pinned = spots.filter((s) => s.lat != null && s.lng != null);

  return (
    <>
      <PageTop>
        <div className="text-center">
          <p className="text-sm sm:text-base font-semibold tracking-[0.35em] text-ink">NUESTRAS</p>
          <h1 className="inline-flex items-center gap-3 font-hand text-7xl sm:text-8xl leading-none text-ink">
            Ubicaciones
            <HeartDoodle className="w-10 h-10 sm:w-12 sm:h-12 text-rose rotate-12 shrink-0" />
          </h1>
          <p className="mt-3 text-lg text-ink-soft">Ven por tus antojos favoritos. Aquí puedes ver dónde estamos hoy y cuál será nuestra próxima parada.</p>
        </div>

        <StopCards spots={spots} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.85fr_1fr] items-stretch">
          {/* Popular items */}
          <section className="rounded-[2rem] bg-white border border-line shadow-sm p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="inline-flex items-center gap-2 font-hand text-4xl sm:text-5xl leading-none">
                  Nuestros Antojos Más Populares <HeartDoodle className="w-8 h-8 text-rose rotate-12 shrink-0" />
                </h2>
                <p className="mt-2 text-ink-soft">Disfruta lo más pedido por nuestra clientela.</p>
              </div>
              <Link href="/menu" className="inline-flex items-center gap-2 rounded-full border-2 border-rose px-5 py-2 font-semibold text-rose hover:bg-rose hover:text-white">
                Ver Menú Completo <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {popular.map((item) => (
                <Link key={item.id} href={`/menu#${item.category}`} className="group rounded-2xl border border-line bg-cream/60 overflow-hidden hover:shadow-md transition-shadow">
                  <Photo slot={`item:${item.id}`} src={item.image} alt={item.name} className="aspect-square" sizes="(min-width:768px) 16vw, 45vw" />
                  <div className="p-3 text-center">
                    <h3 className="font-hand text-2xl leading-none group-hover:text-rose">{shortName(item.name)}</h3>
                    <p className="mt-1 text-sm text-ink-soft line-clamp-2">{item.desc.replace(/\. Con whipped cream\.$/, "")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Map with every stop */}
          <section className="rounded-[2rem] bg-white border border-line shadow-sm p-5 flex flex-col">
            <h2 className="flex items-center gap-2 font-hand text-4xl leading-none">
              <PinIcon className="w-7 h-7 text-rose" /> En el mapa
            </h2>
            {pinned.length > 0 ? (
              <SpotsMap spots={pinned} className="mt-4 flex-1 min-h-72 rounded-2xl overflow-hidden" />
            ) : (
              <p className="mt-4 flex-1 text-ink-soft">Pronto.</p>
            )}
            <CurrentStopMapButton spots={spots} />
          </section>
        </div>
      </PageTop>

      {/* Perks strip */}
      <section className="mt-12 bg-blush/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map(({ icon: Icon, title, sub }, i) => (
            <div key={title} className={`flex items-center gap-4 ${i > 0 ? "lg:border-l lg:border-rose/20 lg:pl-6" : ""}`}>
              <Icon className="w-11 h-11 shrink-0 text-rose" />
              <span>
                <span className="block font-hand text-2xl leading-none">{title}</span>
                <span className="block text-sm text-ink-soft">{sub}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
