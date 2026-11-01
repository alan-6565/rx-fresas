"use client";

import { useMemo, useState } from "react";
import type { Customer } from "@/lib/customers";
import { money } from "@/lib/data";
import { TIME_ZONE } from "@/lib/time";
import { Card, Modal, btn, field } from "@/components/admin/ui";
import { PhoneIcon, SearchIcon } from "@/components/admin/icons";

const DAY = 86_400_000;
const date = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
const dateTime = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

type Filter = "all" | "regulars" | "new" | "missing";
const FILTERS: { id: Filter; label: string; hint: string }[] = [
  { id: "all", label: "All", hint: "" },
  { id: "regulars", label: "Regulars", hint: "3 or more orders" },
  { id: "new", label: "New", hint: "First order in the last 14 days" },
  { id: "missing", label: "Missing you", hint: "Ordered 2+ times, nothing in 30 days" },
];
const SORTS = {
  last: { label: "Most recent", fn: (a: Customer, b: Customer) => b.last.localeCompare(a.last) },
  orders: { label: "Most orders", fn: (a: Customer, b: Customer) => b.orders - a.orders || b.spentCents - a.spentCents },
  spent: { label: "Most spent", fn: (a: Customer, b: Customer) => b.spentCents - a.spentCents },
  name: { label: "Name A–Z", fn: (a: Customer, b: Customer) => a.name.localeCompare(b.name) },
};

function tags(c: Customer, now: number) {
  const out: { label: string; cls: string }[] = [];
  if (c.orders >= 5) out.push({ label: "VIP ♥", cls: "bg-rose text-white" });
  else if (c.orders >= 3) out.push({ label: "Regular", cls: "bg-blush text-rose" });
  if (now - new Date(c.first).getTime() < 14 * DAY) out.push({ label: "New", cls: "bg-sky-50 text-sky-700" });
  if (c.orders >= 2 && now - new Date(c.last).getTime() > 30 * DAY) out.push({ label: "Missing you", cls: "bg-amber-50 text-amber-700" });
  return out;
}

const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function CustomersView({ customers, now }: { customers: Customer[]; now: number }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<keyof typeof SORTS>("last");
  const [open, setOpen] = useState<Customer | null>(null);

  const returning = customers.filter((c) => c.orders > 1).length;
  const spent = customers.reduce((n, c) => n + c.spentCents, 0);
  const orders = customers.reduce((n, c) => n + c.orders, 0);

  const shown = useMemo(() => {
    const q = plain(query.trim());
    const digits = query.replace(/\D/g, "");
    return customers
      .filter((c) => {
        if (filter === "regulars" && c.orders < 3) return false;
        if (filter === "new" && now - new Date(c.first).getTime() >= 14 * DAY) return false;
        if (filter === "missing" && !(c.orders >= 2 && now - new Date(c.last).getTime() > 30 * DAY)) return false;
        if (!q) return true;
        return plain(`${c.name} ${c.email} ${c.favorite}`).includes(q) || (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits));
      })
      .sort(SORTS[sort].fn);
  }, [customers, query, filter, sort, now]);

  // Spreadsheet of the list as shown, for Excel / Google Sheets
  const download = () => {
    const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["Name", "Phone", "Email", "Orders", "Spent", "First order", "Last order", "Favorite"],
      ...shown.map((c) => [c.name, c.phone, c.email, c.orders, (c.spentCents / 100).toFixed(2), date(c.first), date(c.last), c.favorite]),
    ];
    const blob = new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `rx-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: "Customers", value: String(customers.length) },
          { label: "Came back", value: customers.length ? `${returning} · ${Math.round((returning / customers.length) * 100)}%` : "0" },
          { label: "Orders per customer", value: customers.length ? (orders / customers.length).toFixed(1) : "0" },
          { label: "Average spent per customer", value: money(customers.length ? spent / customers.length / 100 : 0) },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-ink-soft">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <SearchIcon className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, email or drink…" className={`${field} pl-9`} />
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as keyof typeof SORTS)} className={`${field} sm:w-44`} aria-label="Sort">
            {Object.entries(SORTS).map(([id, s]) => (
              <option key={id} value={id}>
                {s.label}
              </option>
            ))}
          </select>
          <button onClick={download} disabled={!shown.length} className={btn.ghost}>
            Download list
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              title={f.hint}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${filter === f.id ? "border-rose bg-rose text-white" : "border-line bg-white hover:border-rose"}`}
            >
              {f.label}
            </button>
          ))}
          {filter !== "all" && <span className="self-center text-xs text-ink-soft">{FILTERS.find((f) => f.id === filter)?.hint}</span>}
        </div>
      </Card>

      {customers.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-hand text-4xl text-rose">No customers yet</p>
          <p className="mt-2 text-ink-soft">Everyone who pays for an online order shows up here.</p>
        </Card>
      ) : shown.length === 0 ? (
        <p className="px-1 text-ink-soft">No one matches that.</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.6fr_1fr_0.6fr_0.8fr_0.9fr_1.4fr] gap-3 border-b border-line bg-cream px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-soft lg:grid">
            <span>Customer</span>
            <span>Phone</span>
            <span>Orders</span>
            <span>Spent</span>
            <span>Last order</span>
            <span>Usually gets</span>
          </div>
          <ul className="divide-y divide-line">
            {shown.map((c) => (
              <li key={c.key}>
                <button onClick={() => setOpen(c)} className="grid w-full gap-1 px-5 py-3 text-left hover:bg-cream/60 lg:grid-cols-[1.6fr_1fr_0.6fr_0.8fr_0.9fr_1.4fr] lg:items-center lg:gap-3">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush text-sm font-bold text-rose">{c.name.trim().charAt(0).toUpperCase() || "?"}</span>
                    <span className="font-semibold">{c.name}</span>
                    {tags(c, now).map((t) => (
                      <span key={t.label} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${t.cls}`}>
                        {t.label}
                      </span>
                    ))}
                  </span>
                  <span className="text-sm text-ink-soft">{c.phone}</span>
                  <span className="text-sm">
                    <span className="lg:hidden text-ink-soft">Orders: </span>
                    {c.orders}
                  </span>
                  <span className="text-sm font-semibold">{money(c.spentCents / 100)}</span>
                  <span className="text-sm text-ink-soft">{date(c.last)}</span>
                  <span className="truncate text-sm text-ink-soft">{c.favorite || "—"}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {open && (
        <Modal
          title={open.name}
          onClose={() => setOpen(null)}
          footer={
            <>
              {open.email && (
                <a href={`mailto:${open.email}`} className={btn.ghost}>
                  Email
                </a>
              )}
              <a href={`sms:${open.phone.replace(/[^\d+]/g, "")}`} className={btn.ghost}>
                Text
              </a>
              <a href={`tel:${open.phone.replace(/[^\d+]/g, "")}`} className={`${btn.primary} flex items-center gap-2`}>
                <PhoneIcon className="w-4 h-4" /> Call
              </a>
            </>
          }
        >
          <div className="flex flex-wrap gap-2">
            {tags(open, now).map((t) => (
              <span key={t.label} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.cls}`}>
                {t.label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Phone", open.phone],
              ["Email", open.email || "—"],
              ["Orders", String(open.orders)],
              ["Spent", money(open.spentCents / 100)],
              ["Customer since", date(open.first)],
              ["Usually gets", open.favorite || "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-white px-3 py-2">
                <p className="text-xs text-ink-soft">{k}</p>
                <p className="font-semibold break-words">{v}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Orders</p>
            <ul className="divide-y divide-line rounded-xl border border-line bg-white">
              {open.history.map((o) => (
                <li key={o.id} className="px-3 py-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="font-semibold">
                      {o.number ? `#${o.number}` : "Order"} · {dateTime(o.at)}
                    </span>
                    <span className={o.refunded ? "text-ink-soft line-through" : "font-semibold"}>{money(o.cents / 100)}</span>
                  </div>
                  <p className="text-ink-soft">{o.items}</p>
                  <p className="text-xs text-ink-soft">
                    {o.location}
                    {o.refunded && " · Refunded"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </Modal>
      )}
    </div>
  );
}
