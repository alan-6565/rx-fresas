import type { Metadata } from "next";
import { getMenu } from "@/lib/catalog";
import { PageTop } from "@/components/ui";
import { Builder } from "@/components/antojo/Builder";
import { HeartDoodle, StrawberryIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Crea tu antojo — R&X Fresas con Crema",
  description: "Arma tus fresas con crema a tu gusto: tamaño, crema, drizzles y toppings.",
};

export default async function CreaTuAntojoPage() {
  const { items } = await getMenu();
  const cups = items.filter((i) => i.category === "fresas" && (i.options?.length ?? 0) > 0);

  return (
    <PageTop>
      <div className="relative text-center">
        <StrawberryIcon className="rx-float absolute left-[6%] top-6 hidden w-14 h-14 text-rose/30 sm:block" />
        <StrawberryIcon className="rx-float absolute right-[8%] top-16 hidden w-10 h-10 text-rose/25 sm:block [animation-delay:-3s]" />
        <p className="text-sm font-semibold tracking-[0.35em] text-ink">R&amp;X FRESAS CON CREMA</p>
        <h1 className="mt-1 inline-flex items-center gap-3 font-hand text-6xl sm:text-8xl leading-none">
          Crea tu antojo
          <HeartDoodle className="w-10 h-10 sm:w-14 sm:h-14 text-rose rotate-12 shrink-0" />
        </h1>
        <p className="mt-3 text-lg text-ink-soft">Un antojo hecho a tu gusto. Elige y mira cómo queda tu vaso. ♡</p>
      </div>
      <Builder items={cups} />
    </PageTop>
  );
}
