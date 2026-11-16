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
  const best = Math.max(...deals.map((d) => d.percent));
  return (
    <section aria-label="Descuento de primer pedido" className="mt-8 flex flex-col rounded-[1.75rem] bg-night text-cream sm:flex-row">
      <div className="flex items-baseline gap-3 px-7 pb-4 pt-6 sm:w-52 sm:shrink-0 sm:flex-col sm:items-start sm:justify-center sm:gap-0 sm:py-6">
        <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-[0.24em] text-rose-soft">Primer pedido</span>
        <span className="font-serif text-5xl font-extrabold leading-none sm:mt-2 sm:text-6xl">
          {best}
          <span className="text-rose-soft">%</span>
        </span>
        <span className="text-xs text-cream/55 sm:mt-1.5">de descuento, máximo</span>
      </div>
      <div className="relative flex-1 border-t-2 border-dashed border-white/15 px-7 py-5 sm:border-l-2 sm:border-t-0 sm:py-6">
        <p className="font-semibold">Tu primera bebida o fresas con crema en línea lleva descuento. Se aplica solo al pagar, sin código.</p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
          {deals.map((d) => (
            <li key={d.id}>
              <span className="text-cream/60">{d.label}</span> <b className="ml-1 font-bold text-cream">hasta {d.percent}%</b>
            </li>
          ))}
        </ul>
      </div>
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
