import type { Metadata } from "next";
import Image from "next/image";
import { ContactLinks } from "@/components/ContactLinks";
import { HeartDoodle, MessageIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Contacto — R&X Fresas con Crema" };

// R&X's pink doodle banner, split so its two ends frame the cards on each side
function Doodles({ side }: { side: "l" | "r" }) {
  const left = side === "l";
  return (
    <div
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 mt-10 ${left ? "left-0" : "right-0"} w-[46vw] sm:w-[34vw] lg:w-[30vw] max-w-[620px] aspect-[700/724] opacity-40 lg:opacity-100 ${left ? "[mask-image:radial-gradient(ellipse_closest-side_at_40%_50%,black_75%,transparent)]" : "[mask-image:radial-gradient(ellipse_closest-side_at_60%_50%,black_75%,transparent)]"}`}
      aria-hidden
    >
      <div className={`relative h-full rx-bob ${left ? "" : "[animation-delay:-3.5s]"}`}>
        <Image src={`/images/contacto-doodles-${side}.webp`} alt="" fill sizes="30vw" className="object-cover" priority />
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <section className="relative -mt-24 sm:-mt-28 -mb-20 overflow-hidden bg-[radial-gradient(ellipse_at_center,#fdedf1_0%,#fde3ea_60%,#fbd9e2_100%)]">
      <Doodles side="l" />
      <Doodles side="r" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-8 pt-36 sm:pt-44 pb-28 text-center">
        <div>
          <span className="rx-hero-in inline-flex items-center gap-2.5 rounded-full bg-white/90 px-6 py-2.5 text-lg font-medium shadow-sm">
            <MessageIcon className="w-6 h-6 text-rose" /> Contáctanos
          </span>
        </div>
        <h1 className="rx-hero-in mt-5 inline-flex items-start gap-3 font-serif font-extrabold text-7xl sm:text-8xl leading-none text-[#3d0f1a] [animation-delay:.08s]">
          <span className="relative">
            Contacto
            <svg viewBox="0 0 120 12" className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-1/3 h-3 text-rose" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
              <path d="M4 9c30-6 75-7 112-3" />
            </svg>
          </span>
          <HeartDoodle className="w-11 h-11 sm:w-14 sm:h-14 text-rose rotate-12 shrink-0 rx-float" />
        </h1>
        <p className="rx-hero-in mt-10 text-lg sm:text-2xl [animation-delay:.16s]">¿Tienes preguntas o quieres que vayamos a un evento? ¡Escríbenos!</p>

        <div className="mt-9">
          <ContactLinks />
        </div>

        <p className="mt-14 inline-flex items-center gap-2 font-script text-3xl sm:text-4xl text-rose">
          <span className="relative">
            ¡Los esperamos, mi gente!
            <svg viewBox="0 0 200 12" className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/5 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M4 8c55-7 130-7 192-2" />
            </svg>
          </span>
          <HeartDoodle className="w-9 h-9 rotate-12" />
        </p>
      </div>
    </section>
  );
}
