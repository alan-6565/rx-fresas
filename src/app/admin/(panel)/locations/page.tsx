"use client";

import { useEffect, useState } from "react";
import { DAY_NAMES, WEEK_ORDER, formatRange, mapEmbedUrl, mapsUrl, pacificWeekday, parseMapLink, truckStatus, type DayHours, type Spot } from "@/lib/schedule";
import { pacificDate } from "@/lib/time";
import { useNow } from "@/components/TruckNow";
import { Card, Field, Modal, PageHeader, Toggle, btn, field } from "@/components/admin/ui";
import { PhotoPicker } from "@/components/admin/PhotoPicker";
import { ClockIcon, PencilIcon, PinIcon, PlusIcon } from "@/components/admin/icons";

type Row = {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  image_url: string;
  active: boolean;
  hours: DayHours[];
  closed_on: string | null;
  sort: number;
};

const toSpot = (r: Row): Spot => ({ id: r.id, name: r.name, city: r.city, address: r.address, lat: r.lat, lng: r.lng, image: r.image_url, active: r.active, hours: r.hours, closedOn: r.closed_on });

const json = async <T,>(res: Response): Promise<T> => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong");
  return data as T;
};

const save = async (id: string, patch: Record<string, unknown>) =>
  (await json<{ location: Row }>(await fetch(`/api/admin/locations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }))).location;

export default function LocationsAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [error, setError] = useState("");
  const now = useNow();

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/locations", { cache: "no-store" })
      .then((res) => json<{ locations: Row[] }>(res))
      .then((data) => alive && setRows(data.locations))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const replace = (r: Row) => setRows((list) => list?.map((x) => (x.id === r.id ? r : x)) ?? null);
  const selected = rows?.find((r) => r.id === selectedId) ?? rows?.[0] ?? null;
  const live = rows ? truckStatus(rows.filter((r) => r.active).map(toSpot), now ?? undefined) : null;

  return (
    <>
      <PageHeader title="Locations & Schedule" sub="Set your locations, hours and keep your customers updated.">
        <button onClick={() => setEditing("new")} className={`${btn.primary} flex items-center gap-2`}>
          <PlusIcon className="w-4 h-4" /> Add Location
        </button>
      </PageHeader>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">
          {error}{" "}
          <button onClick={() => setError("")} className="underline">
            Dismiss
          </button>
        </p>
      )}

      {now && live && (
        <Card className="mt-5 px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold">Website right now:</span>
          {live.state === "open" ? (
            <span className={live.closingSoon ? "text-amber-700 font-semibold" : "text-emerald-700"}>
              Open at {live.spot.name} until {live.closesAt}
              {live.closingSoon && ` — showing "closing in ${live.minutesLeft} min"`}
            </span>
          ) : live.state === "later" ? (
            <span className="text-ink-soft">
              Closed · next stop {live.spot.name}, {live.day === "hoy" ? "today" : live.day === "mañana" ? "tomorrow" : live.day.replace("el ", "")} at {live.opensAt}
            </span>
          ) : (
            <span className="text-rose-700">No open hours set — customers can&apos;t order online.</span>
          )}
        </Card>
      )}

      {rows === null ? (
        <p className="mt-10 text-center text-ink-soft">Loading locations…</p>
      ) : rows.length === 0 ? (
        <Card className="mt-5 p-12 text-center">
          <PinIcon className="mx-auto w-10 h-10 text-rose/50" />
          <p className="mt-3 text-ink-soft">No locations yet.</p>
        </Card>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_380px]">
          {/* List */}
          <div className="space-y-3">
            {rows.map((r) => {
              const on = selected?.id === r.id;
              const s = now && r.active ? truckStatus([toSpot(r)], now) : null;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`w-full text-left rounded-2xl border p-4 flex gap-3 ${on ? "bg-blush border-rose/40" : "bg-white border-line hover:border-rose"}`}
                >
                  <PinIcon className="w-6 h-6 shrink-0 text-rose" />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-semibold leading-tight">{r.name}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${r.active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-[#f1e7e6] text-ink-soft"}`}
                      >
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </span>
                    <span className="block text-sm text-ink-soft">{r.city}</span>
                    {s?.state === "open" && <span className={`block mt-1 text-xs font-semibold ${s.closingSoon ? "text-amber-700" : "text-emerald-700"}`}>● Open now</span>}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Map */}
          {selected && (
            <Card className="relative overflow-hidden min-h-72 xl:min-h-0">
              <iframe key={selected.id} title={`Map of ${selected.name}`} src={mapEmbedUrl(toSpot(selected))} className="absolute inset-0 h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              <a href={mapsUrl(toSpot(selected))} target="_blank" rel="noreferrer" className="absolute bottom-3 left-3 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold shadow">
                View on Google Maps
              </a>
              {selected.lat == null && (
                <span className="absolute top-3 left-3 right-3 rounded-lg bg-amber-50 border border-amber-300 px-3 py-1.5 text-xs text-amber-800">
                  No exact pin yet — tap ✎ and paste the Google Maps link for this spot.
                </span>
              )}
            </Card>
          )}

          {/* Details + weekly hours */}
          {selected && <SpotCard key={selected.id} row={selected} onSaved={replace} onEdit={() => setEditing(selected)} onError={setError} className="lg:col-span-2 xl:col-span-1" />}
        </div>
      )}

      {editing && (
        <SpotEditor
          row={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(r, isNew) => {
            if (isNew) setRows((list) => [...(list ?? []), r]);
            else replace(r);
            setSelectedId(r.id);
            setEditing(null);
          }}
          onDeleted={(id) => {
            setRows((list) => list?.filter((x) => x.id !== id) ?? null);
            setSelectedId(null);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function SpotCard({ row, onSaved, onEdit, onError, className }: { row: Row; onSaved: (r: Row) => void; onEdit: () => void; onError: (m: string) => void; className?: string }) {
  const [hours, setHours] = useState(row.hours);
  const [saving, setSaving] = useState(false);
  const now = useNow();
  const dirty = JSON.stringify(hours) !== JSON.stringify(row.hours);
  const today = now ? pacificDate(0, now) : null;
  const closedToday = !!today && row.closed_on === today;
  const todayHours = now ? row.hours[pacificWeekday(now)] : null;

  const setDay = (day: number, patch: Partial<DayHours>) => setHours((h) => h.map((d, i) => (i === day ? { ...d, ...patch } : d)));

  const run = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      const r = await save(row.id, patch);
      onSaved(r);
      return r;
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={`p-5 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 text-lg font-bold">
            <PinIcon className="w-5 h-5 text-rose" /> {row.name}
          </p>
          <p className="ml-7 text-sm text-ink-soft">{row.address || row.city}</p>
        </div>
        <div className="flex items-center gap-2">
          <Toggle on={row.active} onChange={(active) => run({ active })} disabled={saving} label={row.active ? "Hide this location" : "Show this location"} />
          <button onClick={onEdit} aria-label="Edit location" className="p-1.5 text-ink-soft hover:text-rose">
            <PencilIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <p className="mt-1 ml-7 text-xs text-ink-soft">{row.active ? "Shown on the website and open for orders." : "Hidden from the website."}</p>

      <div className={`mt-4 flex items-center justify-between rounded-xl border px-4 py-3 ${closedToday ? "border-rose bg-blush" : "border-line"}`}>
        <span>
          <span className="block text-sm font-semibold">Closed today</span>
          <span className="block text-xs text-ink-soft">Weather, sold out, day off… Turns itself off tomorrow.</span>
        </span>
        <Toggle on={closedToday} disabled={saving || !today} onChange={(on) => run({ closedOn: on ? today : null })} label="Closed today" />
      </div>

      <p className="mt-5 flex items-center gap-2 text-sm font-semibold">
        <ClockIcon className="w-4 h-4" /> Weekly hours
      </p>
      <ul className="mt-2 divide-y divide-line">
        {WEEK_ORDER.map((day) => {
          const d = hours[day];
          return (
            <li key={day} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
              <span className="w-24 font-medium">{DAY_NAMES[day]}</span>
              {d.open ? (
                <span className="flex flex-1 items-center gap-1.5">
                  <input type="time" step={900} value={d.start} onChange={(e) => setDay(day, { start: e.target.value })} aria-label={`${DAY_NAMES[day]} opens`} className="rounded-lg border border-line bg-white px-2 py-1" />
                  –
                  <input type="time" step={900} value={d.end} onChange={(e) => setDay(day, { end: e.target.value })} aria-label={`${DAY_NAMES[day]} closes`} className="rounded-lg border border-line bg-white px-2 py-1" />
                </span>
              ) : (
                <span className="flex-1 text-ink-soft">Closed</span>
              )}
              <Toggle on={d.open} onChange={(open) => setDay(day, { open })} label={`Open on ${DAY_NAMES[day]}`} />
            </li>
          );
        })}
      </ul>
      {dirty && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button onClick={() => setHours(row.hours)} className={btn.ghost}>
            Undo
          </button>
          <button onClick={() => run({ hours })} disabled={saving} className={btn.primary}>
            {saving ? "Saving…" : "Save hours"}
          </button>
        </div>
      )}
      {!dirty && (
        <p className="mt-3 text-xs text-ink-soft">
          Pickup times on the website follow these hours, every 15 minutes.
          {todayHours && ` Today: ${closedToday ? "closed (switch is on)" : todayHours.open ? formatRange(todayHours) : "closed"}.`}
        </p>
      )}
    </Card>
  );
}

function SpotEditor({ row, onClose, onSaved, onDeleted }: { row: Row | null; onClose: () => void; onSaved: (r: Row, isNew: boolean) => void; onDeleted: (id: string) => void }) {
  const [name, setName] = useState(row?.name ?? "");
  const [city, setCity] = useState(row?.city ?? "Richmond, CA");
  const [address, setAddress] = useState(row?.address ?? "");
  const [pin, setPin] = useState(row?.lat != null && row.lng != null ? `${row.lat}, ${row.lng}` : "");
  const [image, setImage] = useState(row?.image_url ?? "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const coords = pin.trim() ? parseMapLink(pin) : null;
  const pinBad = pin.trim() !== "" && !coords;

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const body = { name, city, address, image, lat: coords?.lat ?? null, lng: coords?.lng ?? null };
      if (row) onSaved(await save(row.id, body), false);
      else
        onSaved(
          (await json<{ location: Row }>(await fetch("/api/admin/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }))).location,
          true,
        );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!row) return;
    setBusy(true);
    try {
      await json(await fetch(`/api/admin/locations/${row.id}`, { method: "DELETE" }));
      onDeleted(row.id);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal
      title={row ? "Edit location" : "New location"}
      onClose={onClose}
      footer={
        <>
          {row &&
            (confirmDelete ? (
              <button onClick={remove} disabled={busy} className={`${btn.danger} mr-auto`}>
                Yes, delete {row.name}
              </button>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="mr-auto text-sm font-semibold text-rose-700">
                Delete
              </button>
            ))}
          {error && <p className="w-full text-sm text-rose-700">{error}</p>}
          <button onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button onClick={submit} disabled={busy || !name.trim() || pinBad} className={btn.primary}>
            {busy ? "Saving…" : row ? "Save" : "Add location"}
          </button>
        </>
      }
    >
      <Field label="Name" hint="What customers see, e.g. “El Portal” or “Parada de la tarde”.">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={field} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="City">
          <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} className={field} />
        </Field>
        <Field label="Address or cross streets">
          <input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={160} placeholder="Optional" className={field} />
        </Field>
      </div>
      <Field label="Exact pin" hint={pinBad ? "Couldn't find a location in that — try the Share → Embed a map code, or a Google Maps link." : coords ? `📍 ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "In Google Maps, tap Share → Embed a map and paste the code here (or a maps link)."}>
        <textarea value={pin} onChange={(e) => setPin(e.target.value)} rows={2} placeholder="<iframe src=&quot;https://www.google.com/maps/embed?…" className={`${field} resize-none font-mono text-xs ${pinBad ? "border-rose-400" : ""}`} />
      </Field>
      {coords && (
        <iframe title="Pin preview" src={mapEmbedUrl({ name, city, address, lat: coords.lat, lng: coords.lng })} className="h-44 w-full rounded-xl border border-line" loading="lazy" />
      )}
      <Field label="Photo" hint="Shown on the Ubicaciones page.">
        <PhotoPicker value={image} onChange={setImage} folder="locations" aspect="aspect-[2.2/1]" />
      </Field>
      {!row && <p className="text-xs text-ink-soft">New locations start hidden with no hours. Set the hours, then turn it on.</p>}
    </Modal>
  );
}
