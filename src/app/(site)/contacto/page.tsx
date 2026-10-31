import type { Metadata } from "next";
import { ContactLinks } from "@/components/ContactLinks";
import { Heading, PageTop } from "@/components/ui";
import { HeartDoodle, StrawberryIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Contacto — R&X Fresas con Crema" };

export default function ContactPage() {
  return (
    <PageTop>
      <div className="relative mx-auto max-w-xl text-center">
        <HeartDoodle className="absolute -left-4 top-24 w-10 h-10 text-rose/40 -rotate-12 hidden sm:block" />
        <StrawberryIcon className="absolute -right-6 top-40 w-14 h-14 text-rose/40 rotate-12 hidden sm:block" />
        <Heading as="h1" sub="¿Tienes preguntas o quieres que vayamos a un evento? ¡Escríbenos!">
          Contacto
        </Heading>
        <div className="mt-10 text-left">
          <ContactLinks />
        </div>
        <p className="mt-8 font-script text-2xl text-rose">¡Los esperamos, mi gente! ♡</p>
      </div>
    </PageTop>
  );
}
