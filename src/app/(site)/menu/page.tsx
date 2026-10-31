import Link from "next/link";
import type { Metadata } from "next";
import { money, toppings } from "@/lib/data";
import { hasRequiredUpcharge } from "@/lib/options";
import { getMenu } from "@/lib/catalog";
import { Heading, PageTop, Photo } from "@/components/ui";
import { AddButton } from "@/components/AddButton";
import { CupIcon, LeafIcon, PancakeIcon, SparkleIcon, StrawberryIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Menú — R&X Fresas con Crema" };

// Categories added from the dashboard get the sparkle
const ICONS: Record<string, typeof CupIcon> = {
  cafes: CupIcon,
  fresas: StrawberryIcon,
  pancakes: PancakeIcon,
  otono: LeafIcon,
  extras: SparkleIcon,
};

function Toppings() {
  return (
    <section className="mt-16 rounded-[2rem] bg-blush px-6 py-8 sm:px-10 grid md:grid-cols-[auto_1fr] gap-8 items-center">
      <h2 className="font-hand text-5xl leading-none text-ink">
        Agrega tus <br className="hidden md:block" />
        Toppings <span className="text-rose">♡</span>
        <span className="mt-3 block font-ui text-base text-ink-soft">Dinos tus favoritos en las notas de tu pedido.</span>
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
  const [{ cat }, menu] = await Promise.all([searchParams, getMenu()]);
  // Empty categories stay off the menu, except Extras, which explains the toppings
  const categories = menu.categories.filter((c) => c.id === "extras" || menu.items.some((i) => i.category === c.id));
  const current = categories.find((c) => c.id === cat) ?? categories[0];
  const active = current?.id;
  const list = menu.items.filter((i) => i.category === active);

  return (
    <PageTop>
      <div className="text-center">
        <Heading as="h1" sub="Bebidas, antojos y favoritos para cada momento.">
          Nuestro Menú
        </Heading>
      </div>


      <nav className="mt-8 flex gap-3 overflow-x-auto no-scrollbar pb-2 lg:grid" style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}>
        {categories.map((c) => {
          const Icon = ICONS[c.id] ?? SparkleIcon;
          const on = c.id === active;
          return (
            <Link
              key={c.id}
              href={`/menu?cat=${c.id}`}
              scroll={false}
              className={`shrink-0 min-w-36 flex flex-col items-center gap-2 rounded-2xl border px-5 py-4 font-semibold transition-colors ${
                on ? "bg-rose border-rose text-white shadow-md" : "bg-white border-line hover:border-rose hover:text-rose"
              }`}
            >
              <Icon className="w-8 h-8" />
              {c.label}
            </Link>
          );
        })}
      </nav>

      <section className="mt-12">
        <h2 className="font-hand text-5xl text-ink flex items-center gap-3">
          {current?.title ?? "Pronto"}
          <svg viewBox="0 0 60 12" className="w-14 h-3 text-rose" fill="none">
            <path d="M2 8c8-6 14 4 22-1s14-5 22 0 10 2 12-1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </h2>

        {list.length === 0 ? (
          <p className="mt-4 text-lg text-ink-soft">Personaliza tus fresas y mini pancakes con tus toppings favoritos. Pregunta por los precios en el truck.</p>
        ) : (
          <div className="mt-8 grid md:grid-cols-2 gap-5">
            {list.map((item) => (
              <article key={item.id} className="flex items-center gap-5 rounded-3xl bg-white border border-line p-3 pr-5 shadow-sm">
                <Photo slot={`item:${item.id}`} src={item.image} alt={item.name} className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl shrink-0" sizes="128px" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                    <span className="font-bold text-rose">{hasRequiredUpcharge({ price: item.price, options: item.options ?? [] }) && "Desde "}{money(item.price)}</span>
                  </div>
                  <p className="mt-1 text-ink-soft">{item.desc}</p>
                  <AddButton id={item.id} className="mt-3" />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Toppings />
    </PageTop>
  );
}
