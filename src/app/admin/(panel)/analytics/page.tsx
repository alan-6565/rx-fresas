import Link from "next/link";
import { analytics, RANGES, type Range } from "@/lib/analytics";
import { money } from "@/lib/data";
import { Card, PageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-ink-soft">vs. period before: —</span>;
  return (
    <span className={`text-xs font-semibold ${value >= 0 ? "text-emerald-600" : "text-rose-dark"}`}>
      {value >= 0 ? "↑" : "↓"} {Math.abs(value)}% <span className="font-normal text-ink-soft">vs. period before</span>
    </span>
  );
}

function Stat({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <div className="mt-1 text-xs text-ink-soft">{children}</div>
    </Card>
  );
}

/** Simple bar chart; `best` bars are darker */
function Bars({ data, value, format, label }: { data: { label: string }[]; value: (i: number) => number; format: (n: number) => string; label: string }) {
  const W = 640, H = 220, B = 24, T = 18;
  const values = data.map((_, i) => value(i));
  const max = Math.max(1, ...values);
  const slot = W / data.length;
  const bar = Math.max(3, Math.min(36, slot * 0.7));
  const every = Math.ceil(data.length / 12);
  const best = values.indexOf(max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
      <line x1="0" x2={W} y1={H - B} y2={H - B} stroke="#f1d3d1" />
      {data.map((d, i) => {
        const h = ((H - B - T) * values[i]) / max;
        const x = i * slot + (slot - bar) / 2;
        return (
          <g key={i}>
            <rect x={x} y={H - B - h} width={bar} height={Math.max(h, values[i] ? 2 : 0)} rx={Math.min(6, bar / 2)} fill={i === best && values[i] ? "#c93652" : "#e8506a"} opacity={values[i] ? 1 : 0.25}>
              <title>{`${d.label}: ${format(values[i])}`}</title>
            </rect>
            {i === best && values[i] > 0 && (
              <text x={x + bar / 2} y={H - B - h - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#4a1d24">
                {format(values[i])}
              </text>
            )}
            {i % every === 0 && (
              <text x={x + bar / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="#7d5a5d">
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const { range: asked } = await searchParams;
  const range: Range = typeof asked === "string" && asked in RANGES ? (asked as Range) : "30";
  const a = await analytics(range);
  const busiestHour = [...a.hours].sort((x, y) => y.orders - x.orders)[0];
  const busiestDay = [...a.week].sort((x, y) => y.orders - x.orders)[0];
  const topMax = Math.max(1, ...a.top.map((t) => t.sold));

  return (
    <>
      <PageHeader title="Analytics" sub="Online sales over time. Amounts are your menu prices, without the service and card fees the customer paid.">
        <div className="flex flex-wrap rounded-xl border border-line bg-white p-1 text-sm font-semibold">
          {Object.entries(RANGES).map(([id, label]) => (
            <Link key={id} href={`/admin/analytics?range=${id}`} className={`rounded-lg px-3 py-1.5 ${range === id ? "bg-rose text-white" : "text-ink-soft hover:text-rose"}`}>
              {label}
            </Link>
          ))}
        </div>
      </PageHeader>

      {a.orders === 0 ? (
        <Card className="mt-6 p-10 text-center">
          <p className="font-hand text-4xl text-rose">No sales in this period yet</p>
          <p className="mt-2 text-ink-soft">Charts fill in as online orders get paid. Try a longer range.</p>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Stat label="Sales" value={money(a.sales / 100)}>
              <Change value={a.salesChange} />
            </Stat>
            <Stat label="Orders" value={String(a.orders)}>
              <Change value={a.ordersChange} />
            </Stat>
            <Stat label="Average order" value={money(a.average / 100)}>
              {a.items} items sold · {(a.items / a.orders).toFixed(1)} per order
            </Stat>
            <Stat label="Customers" value={String(a.customers)}>
              {a.returning} came back ({a.customers ? Math.round((a.returning / a.customers) * 100) : 0}%)
            </Stat>
          </div>

          <Card className="mt-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Sales {a.monthly ? "per month" : "per day"}</h2>
              <span className="text-xs text-ink-soft">Hover a bar for the exact amount</span>
            </div>
            <div className="mt-3">
              <Bars data={a.series} value={(i) => a.series[i].cents / 100} format={(n) => money(n)} label="Sales over time" />
            </div>
          </Card>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Busiest hours</h2>
              <p className="text-sm text-ink-soft">
                Most orders come in around <strong className="text-ink">{busiestHour.label.replace("a", " a.m.").replace("p", " p.m.")}</strong>. Good time to have extra hands.
              </p>
              <div className="mt-3">
                <Bars data={a.hours} value={(i) => a.hours[i].orders} format={(n) => `${n} orders`} label="Orders by hour" />
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Busiest days</h2>
              <p className="text-sm text-ink-soft">
                <strong className="text-ink">{busiestDay.label}</strong> brings the most orders.
              </p>
              <div className="mt-3">
                <Bars data={a.week} value={(i) => a.week[i].orders} format={(n) => `${n} orders`} label="Orders by day of the week" />
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <Card className="p-5">
              <h2 className="text-lg font-semibold">Best sellers</h2>
              <ul className="mt-3 space-y-3">
                {a.top.map((t, i) => (
                  <li key={t.name}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-medium">
                        <span className="text-ink-soft">{i + 1}.</span> {t.name}
                      </span>
                      <span>
                        <strong>{t.sold}</strong> sold · {money(t.cents / 100)}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-blush">
                      <div className="h-2 rounded-full bg-rose" style={{ width: `${(t.sold / topMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="text-lg font-semibold">By location</h2>
                <ul className="mt-3 divide-y divide-line">
                  {a.spots.map((s) => (
                    <li key={s.name} className="flex justify-between gap-3 py-2 text-sm">
                      <span className="font-medium">{s.name}</span>
                      <span className="shrink-0">
                        {s.orders} orders · <strong>{money(s.cents / 100)}</strong>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-5">
                <h2 className="text-lg font-semibold">Order to ready</h2>
                <p className="mt-1 text-3xl font-bold">{a.prepMinutes === null ? "—" : `${a.prepMinutes} min`}</p>
                <p className="text-sm text-ink-soft">Average time from when an order comes in to when it&apos;s marked Ready.</p>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
}
