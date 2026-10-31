"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { money } from "@/lib/data";
import { RANGES, type Range, type StaffOrder } from "@/lib/order-types";
import { clearOrderBanners, isIOS, playChime, pushState, soundOn, startAlerts, turnOnPush, type PushState } from "@/lib/alerts";
import { Card, PageHeader, STATUS, StatusPill, type Status } from "@/components/admin/ui";
import { BagIcon, BellIcon, CloseIcon, PhoneIcon, SearchIcon } from "@/components/admin/icons";

const POLL_MS = 5000;
const CHIME_EVERY_MS = 8000;

const TABS: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "All Orders" },
  { id: "new", label: "Pending" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "picked_up", label: "Picked Up" },
  { id: "cancelled", label: "Cancelled" },
];

// The one big button for each step
const NEXT_STEP: Partial<Record<Status, { to: Status; label: string; cls: string }>> = {
  new: { to: "preparing", label: "Accept", cls: "bg-rose hover:bg-rose-dark text-white" },
  preparing: { to: "ready", label: "Mark Ready", cls: "bg-sky-600 hover:bg-sky-700 text-white" },
  ready: { to: "picked_up", label: "Picked Up", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
};

const itemsText = (o: StaffOrder) => o.order_items.map((i) => `${i.name} x${i.quantity}`).join(", ");
const phoneText = (p: string) => {
  const d = p.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
};
const dayText = (date: string) => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
  if (date === today) return "Today";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export default function OrdersPage() {
  const router = useRouter();
  const [range, setRange] = useState<Range>("today");
  const [tab, setTab] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<StaffOrder[] | null>(null);
  const [todays, setTodays] = useState<StaffOrder[]>([]);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [shiftOn, setShiftOn] = useState(false);
  const [push, setPush] = useState<PushState | null>(null);
  const [pushHelp, setPushHelp] = useState(false);
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    try {
      const get = (r: Range) => fetch(`/api/admin/orders?range=${r}`, { cache: "no-store" }).then((res) => {
        if (res.status === 401) router.replace("/admin/login?from=/admin/orders");
        if (!res.ok) throw new Error("Couldn't load orders");
        return res.json() as Promise<{ orders: StaffOrder[] }>;
      });
      // Alerts always watch today's orders, whatever date is on screen
      const [shown, today] = await Promise.all([get(range), range === "today" ? null : get("today")]);
      setOrders(shown.orders);
      const t = today?.orders ?? shown.orders;
      setTodays(t);
      setError("");

      // Ring right away for orders we haven't seen yet (not on the first load)
      const ids = new Set(t.map((o) => o.id));
      if (seen.current && t.some((o) => o.fulfillment_status === "new" && !seen.current!.has(o.id))) playChime();
      seen.current = ids;
    } catch {
      setError("Can't reach the server. Retrying…");
    }
  }, [range, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- first load, then poll
    void load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    void pushState().then(setPush);
  }, []);

  // Keep ringing while any order is waiting to be accepted
  const waiting = todays.filter((o) => o.fulfillment_status === "new");
  useEffect(() => {
    document.title = waiting.length ? `(${waiting.length}) New order${waiting.length > 1 ? "s" : ""} · R&X` : "Orders · R&X";
    if (!waiting.length || !shiftOn) return;
    const t = setInterval(playChime, CHIME_EVERY_MS);
    return () => clearInterval(t);
  }, [waiting.length, shiftOn]);

  const startShift = async () => {
    await startAlerts();
    setShiftOn(soundOn());
    if (waiting.length) playChime();
  };

  const enablePush = async () => {
    if (push === "needs-home-screen" || (isIOS() && push === "unsupported")) return setPushHelp(true);
    setPush(await turnOnPush());
  };

  const setStatus = async (id: string, status: Status) => {
    setBusyId(id);
    const res = await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "Couldn't update that order");
    else {
      const num = orders?.find((o) => o.id === id)?.order_number;
      if (num) clearOrderBanners(num);
    }
    await load();
    setBusyId(null);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders?.length ?? 0 };
    for (const o of orders ?? []) c[o.fulfillment_status] = (c[o.fulfillment_status] ?? 0) + 1;
    return c;
  }, [orders]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase().replace(/^#/, "");
    const digits = q.replace(/\D/g, "");
    return (orders ?? [])
      .filter((o) => tab === "all" || o.fulfillment_status === tab)
      .filter(
        (o) =>
          !q ||
          String(o.order_number).includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          (digits.length >= 3 && o.customer_phone.replace(/\D/g, "").includes(digits)),
      )
      // Waiting orders first, then by pickup time
      .sort((a, b) => Number(b.fulfillment_status === "new") - Number(a.fulfillment_status === "new") || a.created_at.localeCompare(b.created_at) * -1);
  }, [orders, tab, search]);

  const open = orders?.find((o) => o.id === openId) ?? todays.find((o) => o.id === openId) ?? null;

  return (
    <>
      <PageHeader title="Orders" sub="View and manage all orders in real time.">
        <label className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, name or phone…"
            className="w-64 rounded-xl border border-line bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-rose"
          />
        </label>
        <select value={range} onChange={(e) => setRange(e.target.value as Range)} className="rounded-xl border border-line bg-white px-3 py-2.5 text-sm">
          {Object.entries(RANGES).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={enablePush}
          disabled={push === "on"}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${push === "on" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose hover:bg-rose-dark text-white"}`}
        >
          <BellIcon className="w-4 h-4" />
          {push === "on" ? "Notifications on" : push === "blocked" ? "Notifications blocked" : "Turn on notifications"}
        </button>
      </PageHeader>

      {!shiftOn && (
        <button onClick={startShift} className="mt-5 w-full rounded-2xl border-2 border-dashed border-rose bg-blush/60 px-5 py-4 text-left hover:bg-blush">
          <span className="block font-bold text-rose text-lg">Tap here to start your shift 🔔</span>
          <span className="block text-sm text-ink-soft">Turns on the order sound and keeps this screen from going to sleep.</span>
        </button>
      )}

      {pushHelp && (
        <Card className="mt-5 p-5 relative">
          <button onClick={() => setPushHelp(false)} aria-label="Close" className="absolute right-3 top-3 p-1">
            <CloseIcon className="w-5 h-5" />
          </button>
          <p className="font-bold">On iPad and iPhone, add this to the Home Screen first:</p>
          <ol className="mt-2 list-decimal pl-5 text-sm text-ink-soft space-y-1">
            <li>
              In Safari, tap the <strong>Share</strong> button (the square with an arrow).
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
            </li>
            <li>
              Open <strong>R&amp;X Orders</strong> from the Home Screen, sign in, and tap <strong>Turn on notifications</strong> again.
            </li>
          </ol>
        </Card>
      )}

      {error && <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</p>}

      <Card className="mt-5 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-line p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-lg border px-3.5 py-1.5 text-sm font-medium ${tab === t.id ? "bg-rose border-rose text-white" : "border-line hover:border-rose"}`}
            >
              {t.label} ({counts[t.id] ?? 0})
            </button>
          ))}
        </div>

        {orders === null ? (
          <p className="p-10 text-center text-ink-soft">Loading orders…</p>
        ) : shown.length === 0 ? (
          <div className="p-12 text-center">
            <BagIcon className="mx-auto w-10 h-10 text-rose/50" />
            <p className="mt-3 text-ink-soft">{search ? "No orders match that search." : `No ${tab === "all" ? "" : STATUS[tab].label.toLowerCase() + " "}orders for ${RANGES[range].toLowerCase()}.`}</p>
          </div>
        ) : (
          <>
            {/* Table on wide screens */}
            <table className="hidden md:table w-full text-sm">
              <thead className="text-left text-ink-soft">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Pickup</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => {
                  const step = NEXT_STEP[o.fulfillment_status];
                  const isNew = o.fulfillment_status === "new";
                  return (
                    <tr key={o.id} className={`border-b border-line last:border-0 ${isNew ? "bg-amber-50/70" : "hover:bg-cream/60"}`}>
                      <td className="px-4 py-3 font-semibold">#{o.order_number}</td>
                      <td className="px-4 py-3">
                        <span className="block font-medium">{o.customer_name}</span>
                        <span className="block text-xs text-ink-soft whitespace-nowrap">{phoneText(o.customer_phone)}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="line-clamp-2">{itemsText(o)}</span>
                        {o.notes && <span className="mt-0.5 block text-xs text-rose-dark line-clamp-1">Note: {o.notes}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blush px-2.5 py-0.5 text-xs font-semibold text-rose">
                          <BagIcon className="w-3.5 h-3.5" /> Pickup
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={o.fulfillment_status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="block">{o.pickup_time.replace(" p.m.", " PM").replace(" a.m.", " AM")}</span>
                        <span className="block text-xs text-ink-soft">
                          {range === "today" ? o.location : `${dayText(o.pickup_date)} · ${o.location}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{money(o.subtotal_cents / 100)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {step && (
                            <button
                              onClick={() => setStatus(o.id, step.to)}
                              disabled={busyId === o.id}
                              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${step.cls} ${isNew ? "ring-4 ring-rose/25 shadow-md" : ""}`}
                            >
                              {step.label}
                            </button>
                          )}
                          <button onClick={() => setOpenId(o.id)} className="rounded-lg border border-rose px-3 py-1.5 text-xs font-semibold text-rose hover:bg-blush">
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Cards on phones */}
            <ul className="md:hidden divide-y divide-line">
              {shown.map((o) => {
                const step = NEXT_STEP[o.fulfillment_status];
                return (
                  <li key={o.id} className={`p-4 ${o.fulfillment_status === "new" ? "bg-amber-50/70" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          #{o.order_number} · {o.customer_name}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {o.pickup_time} · {o.location}
                        </p>
                      </div>
                      <StatusPill status={o.fulfillment_status} />
                    </div>
                    <p className="mt-2 text-sm">{itemsText(o)}</p>
                    {o.notes && <p className="mt-1 text-xs text-rose-dark">Note: {o.notes}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="flex-1 font-semibold">{money(o.subtotal_cents / 100)}</span>
                      {step && (
                        <button onClick={() => setStatus(o.id, step.to)} disabled={busyId === o.id} className={`rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 ${step.cls}`}>
                          {step.label}
                        </button>
                      )}
                      <button onClick={() => setOpenId(o.id)} className="rounded-lg border border-rose px-4 py-2 text-sm font-semibold text-rose">
                        View
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <p className="mt-3 text-xs text-ink-soft">
        Totals are what R&amp;X keeps (menu prices). Updates every few seconds. Unpaid checkouts never show here.
      </p>

      {open && <OrderDrawer order={open} busy={busyId === open.id} onClose={() => setOpenId(null)} onStatus={(s) => setStatus(open.id, s)} />}
    </>
  );
}

function OrderDrawer({ order: o, busy, onClose, onStatus }: { order: StaffOrder; busy: boolean; onClose: () => void; onStatus: (s: Status) => void }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const step = NEXT_STEP[o.fulfillment_status];
  const back: Partial<Record<Status, Status>> = { preparing: "new", ready: "preparing", picked_up: "ready" };
  const canCancel = ["new", "preparing", "ready"].includes(o.fulfillment_status);

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <aside className="absolute inset-y-0 right-0 w-full max-w-md bg-cream shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between bg-cream/95 backdrop-blur border-b border-line px-5 py-4">
          <div>
            <p className="font-hand text-4xl leading-none">Order #{o.order_number}</p>
            <p className="mt-1 text-xs text-ink-soft">
              Placed {new Date(o.created_at).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <StatusPill status={o.fulfillment_status} />
            {o.payment_status === "refunded" && <span className="text-xs font-semibold text-rose-dark">Refunded</span>}
          </div>

          <Card className="p-4">
            <p className="text-lg font-bold">{o.customer_name}</p>
            <a href={`tel:${o.customer_phone.replace(/[^\d+]/g, "")}`} className="mt-1 inline-flex items-center gap-1.5 text-rose font-semibold">
              <PhoneIcon className="w-4 h-4" /> {phoneText(o.customer_phone)}
            </a>
            <p className="mt-3 text-sm">
              <strong>Pickup:</strong> {dayText(o.pickup_date)} at {o.pickup_time}
              <br />
              <strong>Location:</strong> {o.location}
            </p>
          </Card>

          {o.notes && (
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Customer note</p>
              <p className="mt-1">{o.notes}</p>
            </div>
          )}

          <Card className="p-4">
            <ul className="space-y-2">
              {o.order_items.map((i) => (
                <li key={i.menu_item_id} className="flex justify-between gap-3">
                  <span>
                    <strong className="text-rose">{i.quantity}×</strong> {i.name}
                  </span>
                  <span>{money((i.price_cents * i.quantity) / 100)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-line flex justify-between font-bold">
              <span>Your total</span>
              <span>{money(o.subtotal_cents / 100)}</span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              The customer also paid {money((o.platform_fee_cents + o.card_fee_cents) / 100)} in service and card fees ({money(o.total_cents / 100)} total).
            </p>
          </Card>

          {step && (
            <button onClick={() => onStatus(step.to)} disabled={busy} className={`w-full rounded-xl py-4 text-lg font-bold disabled:opacity-50 ${step.cls}`}>
              {step.label}
            </button>
          )}
          {back[o.fulfillment_status] && (
            <button onClick={() => onStatus(back[o.fulfillment_status]!)} disabled={busy} className="w-full rounded-xl border border-line bg-white py-2.5 text-sm font-semibold">
              Undo: back to {STATUS[back[o.fulfillment_status]!].label}
            </button>
          )}

          {canCancel &&
            (confirmCancel ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm">
                  Cancel order #{o.order_number} and refund the customer <strong>{money(o.total_cents / 100)}</strong>? This can&apos;t be undone.
                </p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => onStatus("cancelled")} disabled={busy} className="flex-1 rounded-lg bg-rose-dark text-white py-2 text-sm font-bold disabled:opacity-50">
                    {busy ? "Refunding…" : "Yes, cancel & refund"}
                  </button>
                  <button onClick={() => setConfirmCancel(false)} className="flex-1 rounded-lg border border-line bg-white py-2 text-sm font-semibold">
                    Keep order
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmCancel(true)} className="w-full py-2 text-sm font-semibold text-rose-dark hover:underline">
                Cancel order &amp; refund
              </button>
            ))}
        </div>
      </aside>
    </div>
  );
}
