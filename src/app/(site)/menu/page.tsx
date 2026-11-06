import type { Metadata } from "next";
import { toppings } from "@/lib/data";
import { getMenu } from "@/lib/catalog";
import { FIRST_ORDER_CATEGORIES, firstOrderPercent } from "@/lib/rewards-rules";
import { MenuHero } from "@/components/menu/MenuHero";
import { MenuItems } from "@/components/menu/MenuItems";

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

/** The first-order discount by section, worked out from each section's lowest price */
function FirstOrderBanner({ sections }: { sections: { id: string; label: string; items: { price: number }[] }[] }) {
  const deals = sections.filter((s) => FIRST_ORDER_CATEGORIES.includes(s.id) && s.items.length).map((s) => ({ id: s.id, label: s.label, percent: firstOrderPercent(Math.round(Math.min(...s.items.map((i) => i.price)) * 100)) }));
  if (!deals.length) return null;
  return (
    <section className="mt-8 rounded-[2rem] bg-wine px-6 py-5 text-center text-white">
      <h2 className="text-xl font-extrabold sm:text-2xl">🎉 Hasta {Math.max(...deals.map((d) => d.percent))}% de descuento en tu primer pedido</h2>
      <p className="mt-1 text-sm sm:text-base">{deals.map((d) => `${d.label}: hasta ${d.percent}%`).join(" · ")}</p>
      <p className="mt-1 text-xs text-white/80">En 1 bebida o fresas con crema de tu primer pedido en línea. El porcentaje depende del precio.</p>
    </section>
  );
}

export default async function MenuPage() {
  const menu = await getMenu();
  // Empty categories stay off the menu, except Extras, which explains the toppings
  const categories = menu.categories.filter((c) => c.id === "extras" || menu.items.some((i) => i.category === c.id));
  const sections = categories.map((c) => ({ id: c.id, label: c.label, title: c.title, badge: BADGES[c.id], items: menu.items.filter((i) => i.category === c.id) }));

  return (
    <>
      <MenuHero />
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <FirstOrderBanner sections={sections} />
        <MenuItems sections={sections} />

        <Toppings />
      </div>
    </>
  );
}
