import type { Metadata } from "next";
import { Button, Heading, LoveNote, PageTop, Photo } from "@/components/ui";
import { CupIcon, HeartDoodle, LeafIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Sobre Nosotros — R&X Fresas con Crema" };

const values = [
  { icon: LeafIcon, title: "Ingredientes de calidad", text: "Usamos productos frescos y de alta calidad." },
  { icon: HeartDoodle, title: "Hecho con cariño", text: "Cada bebida y antojo lo preparamos con amor." },
  { icon: CupIcon, title: "Apoyando lo local", text: "Gracias por ser parte de nuestra historia. ♥" },
];

export default function AboutPage() {
  return (
    <PageTop>
      <section className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Heading as="h1">Nuestra Historia</Heading>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-soft max-w-xl">
            <p>R&amp;X nació con la idea de compartir algo simple pero especial: buenos cafés, fresas con crema y antojos que alegran el día.</p>
            <p>
              Somos un negocio local que aprecia y agradece a toda nuestra comunidad por su apoyo. Cada bebida y antojo lo preparamos con cariño para que disfrutes
              un momento dulce en tu día. <span className="text-rose">♥</span>
            </p>
          </div>
          <Button href="/menu" className="mt-8">
            Conoce Nuestro Menú
          </Button>
        </div>
        <div className="relative">
          <Photo src="/images/historia.jpg" alt="El food truck de R&X Fresas con Crema" className="aspect-[4/3] rounded-[2rem] shadow-xl" priority />
          <div className="absolute -bottom-8 right-4 sm:-right-6 rounded-2xl bg-white px-6 py-4 shadow-lg">
            <LoveNote className="text-2xl" />
          </div>
        </div>
      </section>

      <section className="mt-24 grid sm:grid-cols-3 gap-6">
        {values.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-4 rounded-3xl bg-white border border-line p-6">
            <Icon className="w-12 h-12 text-rose shrink-0" />
            <div>
              <h2 className="font-bold text-lg">{title}</h2>
              <p className="text-ink-soft">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-12 grid grid-cols-3 gap-3 sm:gap-6">
        <Photo src="/images/gal-prep.jpg" alt="Preparando fresas con crema" className="aspect-[4/5] rounded-3xl" sizes="33vw" />
        <Photo src="/images/gal-cup.jpg" alt="Vaso de fresas con crema" className="aspect-[4/5] rounded-3xl" sizes="33vw" />
        <Photo src="/images/gal-pancakes.jpg" alt="Mini pancakes con fresa y plátano" className="aspect-[4/5] rounded-3xl" sizes="33vw" />
      </section>
    </PageTop>
  );
}
