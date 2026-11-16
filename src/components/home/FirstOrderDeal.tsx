import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";

export type DealDrink = { id: string; name: string; image: string; category: string; price: number; from: boolean; percent: number };

const usd = (n: number) => `$${n.toFixed(2)}`;

function Card({ d, hidden = false }: { d: DealDrink; hidden?: boolean }) {
  return (
    <li className="w-40 shrink-0 snap-start sm:w-48" aria-hidden={hidden || undefined}>
      <Link href={`/menu#${d.category}`} tabIndex={hidden ? -1 : undefined} className="group block">
        <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-white/5">
          <Image src={d.image} alt={hidden ? "" : d.name} fill sizes="192px" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
          <span className="absolute left-2.5 top-2.5 rounded-md bg-cream px-2 py-1 text-xs font-extrabold tracking-wide text-ink">−{d.percent}%</span>
        </span>
        <span translate="no" className="notranslate mt-3 block truncate font-semibold leading-tight text-cream">{d.name}</span>
        <span className="mt-0.5 block text-sm">
          <s className="text-cream/45">{usd(d.price)}</s>{" "}
          <span className="font-bold text-rose-soft">{d.from ? "desde " : ""}{usd(d.price - 1)}</span>
        </span>
      </Link>
    </li>
  );
}

/** The first-order discount as a ticket: the number on the stub, the drinks it works on rolling past */
export function FirstOrderDeal({ drinks }: { drinks: DealDrink[] }) {
  if (!drinks.length) return null;
  const best = Math.max(...drinks.map((d) => d.percent));
  return (
    <section aria-labelledby="deal-title" className="mx-auto max-w-7xl px-4 pt-16 sm:px-8">
      <div className="relative rounded-[2rem] bg-night text-cream lg:grid lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="px-7 py-9 sm:px-10 sm:py-11">
          <h2 id="deal-title" className="text-xs font-semibold uppercase tracking-[0.26em] text-rose-soft">
            Primer pedido en línea
          </h2>
          <p className="mt-5 font-serif font-extrabold leading-[0.8]">
            <span className="mb-2 block font-ui text-base font-semibold text-cream/65">hasta</span>
            <span className="text-[6.5rem] sm:text-[7.5rem]">{best}</span>
            <span className="text-6xl text-rose-soft sm:text-7xl">%</span>
          </p>
          <p className="mt-5 max-w-xs text-cream/80">
            de descuento en una bebida o fresas con crema. Se aplica solo al pagar, sin código.
          </p>
          <Button href="/menu" className="mt-7">
            Ordenar ahora
          </Button>
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-cream/45">
            Solo en tu primer pedido en línea. El porcentaje depende del precio de la bebida.
          </p>
        </div>
        <div className="rx-ticket-perf relative min-w-0 border-t-2 border-dashed border-white/15 py-8 lg:border-l-2 lg:border-t-0 lg:py-11">
          <div className="rx-marquee no-scrollbar">
            <ul className="rx-marquee-track gap-4 px-7 sm:px-10 lg:px-8" style={{ ["--rx-dur" as string]: `${drinks.length * 4}s` }}>
              {drinks.map((d) => <Card key={d.id} d={d} />)}
              {drinks.map((d) => <Card key={`${d.id}-2`} d={d} hidden />)}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
