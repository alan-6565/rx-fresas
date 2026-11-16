import type { Metadata } from "next";
import Image from "next/image";
import { getSitePhotos } from "@/lib/site-photos";
import { getMenu } from "@/lib/catalog";
import { NO_PHOTO } from "@/lib/data";
import { Button, Photo } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { Wave } from "@/components/Wave";
import { BagIcon, HeartDoodle, PinIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sobre Nosotros — R&X Fresas con Crema" };

// What they stand for, in their own words underneath; each line gets a photo from the menu section it's about
const values = [
  { title: "Fruta fresca, todos los días.", text: "Usamos productos frescos y de alta calidad.", from: ["fresas"] },
  { title: "Hecho a mano, con cariño.", text: "Cada bebida y antojo lo preparamos con amor.", from: ["cafes"] },
  { title: "De la comunidad, para la comunidad.", text: "Somos un negocio local. Gracias por ser parte de nuestra historia.", from: ["otono", "redbulls"] },
  { title: "Recetas que no encuentras en otro lado.", text: "Postres y cafés creativos que nos hacen especiales.", from: ["redbulls", "otono", "fresas"] },
];

export default async function AboutPage() {
  const [photos, { items }] = await Promise.all([getSitePhotos(), getMenu()]);
  const used = new Set<string>();
  const pics = values.map((v) => {
    const hit = items.find((i) => v.from.includes(i.category) && i.image !== NO_PHOTO && !used.has(i.image));
    if (hit) used.add(hit.image);
    return hit?.image ?? null;
  });
  return (
    <div className="overflow-x-clip -mb-20">
      {/* Dark story banner, tucked under the navbar */}
      <section className="relative -mt-24 sm:-mt-28 bg-night text-white overflow-hidden">
        {/* Their banner photo: cups on the right, dark on the left for the words */}
        <div className="relative lg:absolute lg:top-0 lg:right-0 lg:w-[66%] xl:w-[80%] h-[380px] sm:h-[480px] lg:h-auto lg:aspect-[2/1]">
          <Photo
            slot="about.hero"
            src={photos.photo("about.hero")}
            alt="Cafés helados de R&X Fresas con Crema"
            className="absolute inset-0"
            fit="object-cover object-[78%_50%] lg:object-center"
            sizes="(min-width: 1024px) 80vw, 100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent via-35% to-transparent lg:bg-[linear-gradient(to_right,var(--night),transparent_25%),linear-gradient(to_top,var(--night),transparent_30%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8 -mt-16 lg:mt-0 lg:pt-44 pb-10">
          <div className="max-w-xl rx-hero-in">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-rose-soft/80 px-4 py-1.5 text-rose-soft font-semibold">
              <HeartDoodle className="w-5 h-5" /> Sobre Nosotros
            </span>
            <h1 className="mt-5 font-serif font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-none">
              Nuestra{" "}
              <span className="relative inline-block text-rose-soft">
                Historia
                <svg viewBox="0 0 200 20" className="absolute -bottom-3 left-0 w-[115%] h-4 text-rose" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                  <path d="M4 12c40-6 90-8 150-4M120 18c25-5 50-9 76-10" />
                </svg>
              </span>
            </h1>
            {/* In the owners' own words, from their questionnaire */}
            <div className="mt-8 space-y-4 text-lg leading-relaxed text-white/85">
              <p>Te ofrecemos postres ricos para que te endulces la vida, con cafés, mini pancakes y otros tipos de bebidas.</p>
              <p>
                Somos un negocio local que aprecia y agradece a toda nuestra comunidad por su apoyo. Cada bebida y antojo lo preparamos con cariño para que
                disfrutes un momento dulce en tu día. <span className="text-rose-soft">♡</span>
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/menu" icon={<BagIcon className="w-5 h-5" />}>
                Conoce Nuestro Menú
              </Button>
              <Button href="/ubicaciones" variant="light" arrow={false} icon={<PinIcon className="w-5 h-5" />} className="border-white/60">
                Nuestras Ubicaciones
              </Button>
            </div>
          </div>

          {/* What they stand for */}
          <div className="mt-16 lg:mt-24">
            <p className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.26em] text-rose-soft">
              Lo que nos mueve <span className="h-px flex-1 max-w-40 bg-rose-soft/50" />
            </p>
            <ol className="mt-6">
              {values.map((v, i) => (
                <li key={v.title} className="border-t border-white/15 last:border-b">
                  <Reveal delay={i * 80}>
                    <div className="group grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 py-6 sm:grid-cols-[3rem_minmax(0,1fr)] lg:grid-cols-[3.5rem_minmax(0,1fr)_17rem] lg:gap-x-8 lg:py-8">
                      <span className="self-start pt-2 font-serif text-lg italic text-rose-soft sm:pt-3 sm:text-xl lg:self-center lg:pt-0">{String(i + 1).padStart(2, "0")}</span>
                      <h2 className="font-serif text-[1.65rem] font-extrabold leading-[1.15] sm:text-4xl lg:text-[2.75rem]">
                        {pics[i] && (
                          <span className="relative mr-3 inline-block h-9 w-[4.5rem] -translate-y-1 overflow-hidden rounded-full align-middle ring-1 ring-white/25 transition-[width] duration-500 ease-out group-hover:w-28 sm:mr-4 sm:h-12 sm:w-24 sm:group-hover:w-36 lg:h-14 lg:w-28 lg:group-hover:w-40">
                            <Image src={pics[i]} alt="" fill sizes="160px" className="object-cover" />
                          </span>
                        )}
                        <span>{v.title}</span>
                      </h2>
                      <p className="col-start-2 text-white/65 lg:col-start-3 lg:row-start-1">{v.text}</p>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Pink waves rolling in over the dark */}
      <div className="relative h-16 sm:h-24 bg-night overflow-hidden -mb-px" aria-hidden>
        <Wave fill="#e7a1ad" top={70} dip={45} className="rx-wave-slow opacity-90" />
        <Wave fill="#fbe5e2" top={100} dip={58} className="rx-wave" />
      </div>

      {/* Mission */}
      <section className="relative bg-gradient-to-b from-[#fbe5e2] to-[#f8d6d6] overflow-hidden">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 pt-6 pb-12 grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">
          <Reveal>
            <Photo slot="about.mission" src={photos.photo("about.mission")} alt="El food truck de R&X Fresas con Crema" className="aspect-[16/9] rounded-[2rem] shadow-xl" sizes="(min-width: 1024px) 50vw, 100vw" />
          </Reveal>
          <Reveal delay={120}>
            <p className="flex items-center gap-4 text-sm font-bold uppercase tracking-[0.18em] text-ink">
              Nuestra Misión <span className="h-px w-40 bg-rose/70" />
            </p>
            <h2 className="mt-4 font-serif font-extrabold text-4xl sm:text-5xl leading-[1.08] text-night">
              Más que postres,
              <br />
              una <em className="text-rose-dark">experiencia dulce.</em>
            </h2>
            <p className="mt-5 text-lg text-ink max-w-md">Brindar postres y bebidas únicas, con un servicio amable y una experiencia que siempre quieras volver.</p>
          </Reveal>
        </div>

        {/* Their own photos */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-8 pb-36 sm:pb-44 grid grid-cols-3 gap-3 sm:gap-6">
          {(["about.1", "about.2", "about.3"] as const).map((slot, i) => (
            <Reveal key={slot} delay={i * 100}>
              <Photo
                slot={slot}
                src={photos.photo(slot)}
                alt={["Fresas con crema con granola", "Café helado de R&X", "Mini pancakes con fresa y plátano"][i]}
                className="aspect-square rounded-3xl shadow-lg"
                sizes="33vw"
              />
            </Reveal>
          ))}
        </div>

        {/* Strawberry cream along the bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 sm:h-28 overflow-hidden" aria-hidden>
          <Wave fill="#f6b3c0" top={60} dip={30} className="rx-wave-slow" />
          <Wave fill="#f490a2" top={100} dip={28} className="rx-wave" />
        </div>
        <div className="absolute right-0 bottom-0 w-44 sm:w-64 aspect-[264/194] [mask-image:radial-gradient(ellipse_closest-side_at_60%_58%,black_60%,transparent)] rx-bob" aria-hidden>
          <Image src="/images/about-berries-r.webp" alt="" fill sizes="256px" className="object-contain" />
        </div>
        <div className="absolute left-0 bottom-0 w-20 sm:w-28 aspect-[112/129] [mask-image:radial-gradient(ellipse_closest-side_at_45%_55%,black_60%,transparent)] rx-bob [animation-delay:-3s]" aria-hidden>
          <Image src="/images/about-berry-l.webp" alt="" fill sizes="112px" className="object-contain" />
        </div>
      </section>
    </div>
  );
}
