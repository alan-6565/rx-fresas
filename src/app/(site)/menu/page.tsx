import type { Metadata } from "next";
import { toppings } from "@/lib/data";
import { getMenu } from "@/lib/catalog";
import { MenuHero } from "@/components/menu/MenuHero";
import { MenuItems } from "@/components/menu/MenuItems";
import { BuilderOnLoad } from "@/components/antojo/BuilderSheet";

export const metadata: Metadata = { title: "Menú — R&X Fresas con Crema" };

const BADGES: Record<string, string> = { otono: "Temporada" };

function Toppings() {
  return (
    <section id="toppings" className="mt-16 scroll-mt-40 rounded-[2rem] bg-blush px-6 py-8 sm:px-10 grid md:grid-cols-[auto_1fr] gap-8 items-center">
      <h2 className="font-hand text-5xl leading-none text-ink">
        Agrega tus <br className="hidden md:block" />
        Toppings <span className="text-rose">♡</span>
        <span className="mt-3 block font-ui text-base text-ink-soft">Elígelos al personalizar tu orden.</span>
      </h2>
      <div className="grid sm:grid-cols-[auto_auto_1fr] gap-8">
        {toppings.map((t) => (
          <div key={t.group}>
            <h3 className="font-bold text-lg">{t.group}</h3>
            <ul className={`mt-1 text-ink-soft ${t.list.length > 4 ? "columns-2 gap-8" : ""}`}>
              {t.list.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function MenuPage({ searchParams }: PageProps<"/menu">) {
  const [{ crear }, menu] = await Promise.all([searchParams, getMenu()]);
  // Empty categories stay off the menu, except Extras, which explains the toppings
  const categories = menu.categories.filter((c) => c.id === "extras" || menu.items.some((i) => i.category === c.id));
  const sections = categories.map((c) => ({ id: c.id, label: c.label, title: c.title, badge: BADGES[c.id], items: menu.items.filter((i) => i.category === c.id) }));

  return (
    <>
      <MenuHero />
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <MenuItems sections={sections} />

        <Toppings />
      </div>
      {crear === "1" && <BuilderOnLoad />}
    </>
  );
}
