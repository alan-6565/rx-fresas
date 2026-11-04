import type { Metadata } from "next";
import Image from "next/image";
import { getSitePhotos } from "@/lib/site-photos";
import { Button, Photo } from "@/components/ui";
import { Reveal } from "@/components/Reveal";
import { BagIcon, HeartDoodle, LeafIcon, PeopleIcon, PinIcon, StrawberryIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sobre Nosotros — R&X Fresas con Crema" };

const values = [
  { icon: StrawberryIcon, title: "Ingredientes de Calidad", text: "Usamos productos frescos y de alta calidad." },
  { icon: HeartDoodle, title: "Hecho con Cariño", text: "Cada bebida y antojo lo preparamos con amor." },
  { icon: PeopleIcon, title: "Apoyando lo Local", text: "Gracias por ser parte de nuestra historia." },
  { icon: LeafIcon, title: "Postres y Cafés Únicos", text: "Recetas creativas que nos hacen especiales." },
];

// One stretch of wave, drawn twice side by side so it can roll forever
const wave = (top: number, dip: number) =>
  `M0 ${top} C240 ${top - dip} 480 ${top - dip} 720 ${top} C960 ${top + dip} 1200 ${top + dip} 1440 ${top} ` +
  `C1680 ${top - dip} 1920 ${top - dip} 2160 ${top} C2400 ${top + dip} 2640 ${top + dip} 2880 ${top} V160 H0 Z`;

function Wave({ fill, top, dip, className }: { fill: string; top: number; dip: number; className: string }) {
  return (
    <svg viewBox="0 0 2880 160" preserveAspectRatio="none" className={`absolute inset-y-0 left-0 w-[200%] h-full ${className}`} aria-hidden>
      <path d={wave(top, dip)} fill={fill} />
    </svg>
  );
}

function Sparks({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className={className} aria-hidden>
      <path d="M6 14 20 18M8 26l13-3M12 36l10-8" />
    </svg>
  );
}

export default async function AboutPage() {
  const photos = await getSitePhotos();
  return (
    <div className="overflow-x-clip -mb-20">
      {/* Dark story banner, tucked under the navbar */}
      <section className="relative -mt-24 sm:-mt-28 bg-night text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(120,60,40,.35),transparent_40%),radial-gradient(circle_at_45%_10%,rgba(232,80,106,.12),transparent_35%)]" aria-hidden />

        {/* Their photo on the right, melting into the dark */}
        <div className="relative lg:absolute lg:inset-y-0 lg:right-0 lg:w-[56%] h-[420px] sm:h-[520px] lg:h-auto">
          <Photo slot="about.story" src={photos.photo("about.story")} alt="Cafés de R&X Fresas con Crema" className="absolute inset-0" sizes="(min-width: 1024px) 56vw, 100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-night via-transparent via-40% to-transparent lg:bg-[linear-gradient(to_right,var(--night)_4%,rgba(31,20,22,.7)_20%,transparent_50%),linear-gradient(to_top,var(--night),transparent_30%)]" />
        </div>
        <div className="pointer-events-none hidden lg:block absolute inset-y-0 right-0 w-[56%]" aria-hidden>
          <HeartDoodle className="absolute left-[2%] top-[48%] w-14 h-14 text-rose-soft -rotate-12 rx-float" />
          <HeartDoodle className="absolute right-[6%] top-[22%] w-16 h-16 text-rose-soft rotate-12 rx-float [animation-delay:-3s]" />
          <Sparks className="absolute right-[1%] top-[34%] w-10 h-10 text-rose-soft -scale-x-100" />
          <Sparks className="absolute left-[12%] top-[74%] w-10 h-10 text-rose-soft" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-8 -mt-28 lg:mt-0 lg:pt-44 pb-10">
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
              <p>Te ofrecemos postres 🍨 ricos para que te endulces la vida, con cafés, mini pancakes y otros tipos de bebidas.</p>
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
          <Reveal className="mt-14 lg:mt-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-[2rem] border border-white/20 bg-white/[0.04] backdrop-blur-sm">
              {values.map(({ icon: Icon, title, text }, i) => (
                <div
                  key={title}
                  className={`flex items-center gap-4 px-6 py-6 ${i > 0 ? "border-t sm:border-t-0 border-white/15" : ""} ${i % 2 ? "sm:border-l" : ""} ${i > 1 ? "sm:border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""} border-white/15`}
                >
                  <Icon className="w-12 h-12 text-rose-soft shrink-0" />
                  <div>
                    <h2 className="font-bold leading-tight">{title}</h2>
                    <p className="mt-1 text-sm text-white/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
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
