import type { Metadata } from "next";
import { toppings } from "@/lib/data";
import { getMenu } from "@/lib/catalog";
import { MenuHero } from "@/components/menu/MenuHero";
import { MenuItems } from "@/components/menu/MenuItems";
import { BuilderOnLoad } from "@/components/antojo/BuilderSheet";
import { BoltIcon, CupIcon, LeafIcon, PancakeIcon, SparkleIcon, StrawberryIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Menú — R&X Fresas con Crema" };

// Categories added from the dashboard get the sparkle
const ICONS: Record<string, typeof CupIcon> = {
  cafes: CupIcon,
  fresas: StrawberryIcon,
  pancakes: PancakeIcon,
  otono: LeafIcon,
  redbulls: BoltIcon,
  extras: SparkleIcon,
};
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
        <nav
          className="relative z-10 -mt-14 flex gap-3 overflow-x-auto no-scrollbar px-1 pb-3 pt-4 lg:grid"
          style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}
        >
          {categories.map((c) => {
            const Icon = ICONS[c.id] ?? SparkleIcon;
            return (
              <a
                key={c.id}
                href={`#${c.id}`}
                className={`relative shrink-0 min-w-36 flex flex-col items-center gap-2 rounded-2xl border px-5 py-4 font-bold transition-all hover:-translate-y-0.5 bg-white/90 border-white text-ink shadow-[0_6px_20px_rgba(232,80,106,0.10)] backdrop-blur hover:border-rose hover:text-rose`}
              >
                {BADGES[c.id] && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-rose px-2.5 py-0.5 text-[11px] font-bold text-white shadow">{BADGES[c.id]}</span>
                )}
                <Icon className="w-8 h-8 text-rose" />
                {c.label}
              </a>
            );
          })}
        </nav>

        <MenuItems sections={sections} />

        <Toppings />
      </div>
      {crear === "1" && <BuilderOnLoad />}
    </>
  );
}
