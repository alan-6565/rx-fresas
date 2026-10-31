import Link from "next/link";
import { business, money } from "@/lib/data";
import { hasRequiredUpcharge } from "@/lib/options";
import { getSitePhotos } from "@/lib/site-photos";
import { getMenu, getSpots } from "@/lib/catalog";
import { hoursSummary, mapsUrl } from "@/lib/schedule";
import { Button, Heading, LoveNote, Photo } from "@/components/ui";
import { Socials } from "@/components/Navbar";
import { AddButton } from "@/components/AddButton";
import { TruckNow } from "@/components/TruckNow";
import { ClockIcon, CupIcon, HeartDoodle, LeafIcon, PancakeIcon, PinIcon, StrawberryIcon } from "@/components/icons";

const features = [
  { icon: StrawberryIcon, title: "Fresas con Crema", sub: "Frescas y deliciosas", href: "/menu?cat=fresas" },
  { icon: CupIcon, title: "Cafés Fríos y Calientes", sub: "Para cualquier momento", href: "/menu?cat=cafes" },
  { icon: PancakeIcon, title: "Mini Pancakes", sub: "El antojo perfecto", href: "/menu?cat=pancakes" },
  { icon: LeafIcon, title: "Especiales de Temporada", sub: "Sabores únicos", href: "/menu?cat=otono" },
];

export default async function Home() {
  const [{ categories, items }, spots, photos] = await Promise.all([getMenu(), getSpots(), getSitePhotos()]);
  // Cafés up front (or whatever's first on the menu), and the seasonal section only while it has drinks
  // (one card per photo, so two sizes of the same cup don't show twice)
  const cafes = (items.some((i) => i.category === "cafes") ? items.filter((i) => i.category === "cafes") : items)
    .filter((item, i, list) => list.findIndex((x) => x.image === item.image) === i)
    .slice(0, 4);
  const otono = items.filter((i) => i.category === "otono").slice(0, 2);
  const otonoTitle = categories.find((c) => c.id === "otono")?.label ?? "Para el Otoño";

  return (
    <>
      {/* Hero: the food truck at night */}
      <section className="relative -mt-24 sm:-mt-28 min-h-[640px] lg:min-h-[760px] overflow-hidden bg-night text-white">
        <Photo slot="home.hero" src={photos.photo("home.hero")} alt="El food truck de R&X Fresas con Crema de noche" className="absolute inset-0 lg:left-[30%]" sizes="100vw" priority fit="object-cover object-[70%_center]" />
        <div className="absolute inset-0 bg-night/45 lg:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-night/95 via-night/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-night/80 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8 pt-40 sm:pt-48 pb-20">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase -rotate-3 origin-left">Café frío y caliente · Antojos · Mini pancakes</p>
          <h1 className="mt-4 font-script leading-[0.85] -rotate-6 origin-left">
            <span className="block text-rose-soft text-8xl sm:text-[10rem] drop-shadow-lg [-webkit-text-stroke:4px_var(--rose-soft)]">R&amp;X</span>
            <span className="block text-6xl sm:text-8xl drop-shadow-lg [-webkit-text-stroke:1.5px_white]">
              Fresas con <span className="text-white">Crema</span>
            </span>
          </h1>
          <p className="mt-10 max-w-sm text-lg sm:text-xl">
            {business.tagline} <span className="text-rose-soft">♥</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/menu" icon={<CupIcon className="w-6 h-6" />}>
              Ver Menú
            </Button>
            <Button href="/ubicaciones" variant="light" arrow={false} icon={<PinIcon className="w-5 h-5" />}>
              Nuestras Ubicaciones
            </Button>
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section className="relative bg-cream border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8 grid grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto] gap-y-8 items-center">
          {features.map(({ icon: Icon, title, sub, href }, i) => (
            <Link key={title} href={href} className={`group flex items-center gap-4 px-2 sm:px-6 ${i > 0 ? "lg:border-l border-line" : ""}`}>
              <Icon className="w-12 h-12 sm:w-14 sm:h-14 text-rose shrink-0 group-hover:scale-110 transition-transform" />
              <span>
                <span className="block font-semibold leading-tight">{title}</span>
                <span className="block text-sm text-ink-soft">{sub}</span>
              </span>
            </Link>
          ))}
          <LoveNote className="hidden lg:block text-2xl pl-6" />
        </div>
      </section>

      {/* Menu preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Heading sub="Bebidas, antojos y favoritos para cada momento.">Nuestro Menú</Heading>
          <Button href="/menu" variant="outline">
            Ver todo
          </Button>
        </div>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {cafes.map((item) => (
            <article key={item.id} className="group rounded-2xl bg-white shadow-sm border border-line overflow-hidden">
              <Photo slot={`item:${item.id}`} src={item.image} alt={item.name} className="aspect-square" sizes="(min-width:1024px) 25vw, 50vw" />
              <div className="p-4 text-center">
                <h3 className="font-semibold leading-tight">{item.name}</h3>
                <p className="mt-1 text-rose font-bold">{hasRequiredUpcharge({ price: item.price, options: item.options ?? [] }) && "Desde "}{money(item.price)}</p>
                <p className="text-sm text-ink-soft">{item.desc}</p>
                <AddButton id={item.id} className="mt-3 w-full" />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Seasonal */}
      {otono.length > 0 && (
      <section className="mt-24 bg-cocoa text-cream relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-16 grid lg:grid-cols-[1fr_1.4fr] gap-10 items-center">
          <div>
            <p className="font-semibold tracking-[0.2em] uppercase text-rose-soft text-sm">Temporada</p>
            <h2 className="mt-2 font-hand text-6xl sm:text-7xl leading-none flex items-center gap-3">
              {otonoTitle} <LeafIcon className="w-10 h-10 text-[#e9945a]" />
            </h2>
            <p className="mt-4 text-lg text-cream/80">Bebidas de temporada que te van a encantar ♥</p>
            <Button href="/menu?cat=otono" className="mt-8">
              Pídelas ya
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {otono.map((item) => (
              <article key={item.id} className="relative rounded-3xl overflow-hidden aspect-square shadow-xl">
                <Photo slot={`item:${item.id}`} src={item.image} alt={item.name} className="absolute inset-0" sizes="(min-width:1024px) 28vw, 50vw" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 sm:p-5 pt-16">
                  <h3 className="font-hand text-3xl sm:text-4xl leading-none">{item.name}</h3>
                  <p className="mt-1 text-sm text-cream/80">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Story teaser */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 pt-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Heading>Nuestra Historia</Heading>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft max-w-xl">
            R&amp;X nació con la idea de compartir algo simple pero especial: buenos cafés, fresas con crema y antojos que alegran el día. Somos un negocio local que
            aprecia y agradece a toda nuestra comunidad por su apoyo.
          </p>
          <Button href="/nosotros" className="mt-8">
            Conoce más
          </Button>
        </div>
        <div className="relative">
          <Photo slot="home.story" src={photos.photo("home.story")} alt="El food truck de R&X" className="aspect-[4/3] rounded-[2rem] shadow-xl" />
          <div className="absolute -bottom-8 -left-4 sm:-left-10 rounded-2xl bg-blush px-6 py-4 shadow-lg">
            <LoveNote className="text-2xl" />
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 pt-28 text-center">
        <Heading sub="¡Ven por tu antojo favorito! ♥">Dónde Nos Encontrarás</Heading>
        <TruckNow spots={spots} className="mt-8 mx-auto max-w-3xl" />
        <div className="mt-10 grid sm:grid-cols-2 gap-6 text-left">
          {spots.map((l) => (
            <article key={l.id} className="rounded-3xl bg-white border border-line shadow-sm overflow-hidden">
              <Photo slot={`spot:${l.id}`} src={l.image} alt={`Food truck en ${l.name}`} className="aspect-[2.2/1]" />
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-bold">
                    <PinIcon className="w-6 h-6 text-rose" /> {l.name}
                  </h3>
                  <p className="text-ink-soft ml-8">{l.city}</p>
                  {hoursSummary(l.hours).map((h) => (
                    <p key={h} className="mt-1 flex items-center gap-2 text-sm ml-8">
                      <ClockIcon className="w-4 h-4 shrink-0" /> {h}
                    </p>
                  ))}
                </div>
                <Button href={mapsUrl(l)} className="text-sm px-5 py-2.5">
                  Cómo llegar
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Follow us */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8 pt-24">
        <div className="relative rounded-[2.5rem] bg-blush px-6 py-12 sm:p-14 text-center overflow-hidden">
          <HeartDoodle className="absolute top-6 left-8 w-14 h-14 text-rose/30 -rotate-12" />
          <StrawberryIcon className="absolute bottom-6 right-8 w-16 h-16 text-rose/30 rotate-12" />
          <h2 className="font-hand text-5xl sm:text-6xl">¡Los esperamos, mi gente!</h2>
          <p className="mt-3 text-ink-soft">Síguenos para ver dónde estamos hoy y los especiales de la semana.</p>
          <div className="mt-6 flex justify-center gap-6 text-ink">
            <Socials className="w-8 h-8" />
          </div>
          <p className="mt-3 font-semibold text-rose">{business.handle}</p>
        </div>
      </section>
    </>
  );
}
