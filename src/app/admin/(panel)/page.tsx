import Image from "next/image";
import Link from "next/link";
import { dashboardStats } from "@/lib/admin-stats";
import { money } from "@/lib/data";
import { TIME_ZONE } from "@/lib/time";
import { Card, PageHeader } from "@/components/admin/ui";
import { BagIcon, CalendarEditIcon, CartIcon, ClockIcon, HeartIcon, SparkleIcon, TrendIcon } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-ink-soft">vs. yesterday: —</span>;
  const up = value >= 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-dark"}`}>
      {up ? "↑" : "↓"} {Math.abs(value)}% <span className="font-normal text-ink-soft">vs. yesterday</span>
    </span>
  );
}

function Stat({ label, value, icon, children }: { label: string; value: string; icon: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Card className="p-5 flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-ink-soft">{label}</p>
        <p className="mt-1 text-3xl font-bold text-ink">{value}</p>
        <div className="mt-1">{children}</div>
      </div>
      <span className="text-rose">{icon}</span>
    </Card>
  );
}

/** Orders per hour today, drawn like the mockup's line chart */
function OrdersChart({ data }: { data: { hour: number; orders: number }[] }) {
  const W = 560, H = 220, L = 30, B = 26, T = 10;
  const max = Math.max(4, ...data.map((d) => d.orders));
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const x = (i: number) => L + (i * (W - L - 10)) / (data.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / top);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.orders).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const label = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? "am" : "pm"}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Orders per hour today">
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1={L} x2={W - 10} y1={y(i * step)} y2={y(i * step)} stroke="#f1d3d1" strokeDasharray={i ? "3 4" : undefined} />
          <text x={L - 8} y={y(i * step) + 4} textAnchor="end" fontSize="11" fill="#7d5a5d">
            {i * step}
          </text>
        </g>
      ))}
      <path d={area} fill="#e8506a" opacity="0.12" />
      <path d={line} fill="none" stroke="#e8506a" strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.hour}>
          {d.orders > 0 && <circle cx={x(i)} cy={y(d.orders)} r="3.5" fill="#fff" stroke="#e8506a" strokeWidth="2" />}
          {i % 2 === 0 && (
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="#7d5a5d">
              {label(d.hour)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

const ACTIONS = [
  { href: "/admin/orders", icon: CartIcon, title: "Open Orders", sub: "See and update today's orders" },
  { href: "/admin/menu", icon: CalendarEditIcon, title: "Update Menu", sub: "Add or edit items" },
  { href: "/admin/promotions", icon: SparkleIcon, title: "Post Promotion", sub: "Share a special or event" },
];

export default async function DashboardPage() {
  const s = await dashboardStats();
  const date = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date());

  return (
    <>
      <PageHeader title="Dashboard" sub="Welcome back! Here's what's happening today.">
        <span className="rounded-xl border border-line bg-white px-4 py-2 text-sm">{date}</span>
        <span className="flex items-center gap-2 rounded-xl border border-line bg-white pl-1.5 pr-4 py-1.5">
          <span className="relative w-8 h-8 rounded-full overflow-hidden">
            <Image src="/images/logo-v2.png" alt="" fill sizes="32px" className="object-cover" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold">R&amp;X Fresas</span>
            <span className="block text-xs text-ink-soft">Owner</span>
          </span>
        </span>
      </PageHeader>

      <div className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="Orders Today" value={String(s.ordersToday)} icon={<BagIcon className="w-9 h-9" />}>
          <Change value={s.ordersChange} />
        </Stat>
        <Stat label="Sales Today" value={money(s.salesToday / 100)} icon={<TrendIcon className="w-9 h-9" />}>
          <Change value={s.salesChange} />
        </Stat>
        <Stat label="Pending Orders" value={String(s.pending)} icon={<ClockIcon className="w-9 h-9" />}>
          <Link href="/admin/orders" className="text-xs font-semibold text-rose hover:underline">
            Open orders →
          </Link>
        </Stat>
        <Stat label="Returning Customers" value={String(s.returning)} icon={<HeartIcon className="w-9 h-9" />}>
          <span className="text-xs text-ink-soft">of {s.customers} total customers</span>
        </Stat>
      </div>

      <div className="mt-4 grid xl:grid-cols-[1.4fr_1fr] gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Order Overview</h2>
            <span className="flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="w-2 h-2 rounded-full bg-rose" /> Pickup orders by hour
            </span>
          </div>
          <div className="mt-3">
            <OrdersChart data={s.byHour} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold text-lg">Top Items Today</h2>
          {s.topItems.length === 0 ? (
            <p className="mt-6 text-sm text-ink-soft">No orders yet today. Items will show up here as they sell.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {s.topItems.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0">
                    <Image src={t.image} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                  <span className="flex-1 font-medium text-sm">{t.name}</span>
                  <span className="text-sm font-semibold">{money(t.cents / 100)}</span>
                  <span className="w-16 text-right text-xs text-ink-soft">{t.sold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-4">
        {ACTIONS.map(({ href, icon: Icon, title, sub }) => (
          <Link key={href} href={href}>
            <Card className="p-4 flex items-center gap-4 hover:border-rose transition-colors">
              <span className="grid place-items-center w-12 h-12 rounded-full bg-blush text-rose">
                <Icon className="w-6 h-6" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-ink-soft">{sub}</span>
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
