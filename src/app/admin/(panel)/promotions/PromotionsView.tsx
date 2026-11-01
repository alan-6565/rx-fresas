"use client";

import Image from "next/image";
import { useState } from "react";
import { LINKS, isRunning, newPromotion, pacificToday, promotionProblem, type Promotion } from "@/lib/promotions";
import { PhotoPicker } from "@/components/admin/PhotoPicker";
import { PencilIcon, PlusIcon } from "@/components/admin/icons";
import { Card, Field, Modal, Toggle, btn, field } from "@/components/admin/ui";

// Ready-made starting points, in Spanish like the website
const IDEAS: { label: string; p: Partial<Promotion> }[] = [
  { label: "New drink", p: { title: "¡Nuevo en el menú!", message: "Prueba nuestra nueva bebida de temporada.", cta: "Ver menú", href: "/menu#otono", homeCard: true } },
  { label: "Daily special", p: { title: "Martes de Fresas", message: "16 oz al precio de 12 oz todo el día.", cta: "Ordena ahora", href: "/menu#fresas" } },
  { label: "Closed / new hours", p: { title: "Hoy cerramos temprano", message: "Abrimos mañana a la hora de siempre. ¡Gracias!", cta: "Ver horario", href: "/ubicaciones" } },
  { label: "Event", p: { title: "¡Nos vemos en el evento!", message: "Este sábado estaremos en un lugar especial.", cta: "Ver ubicaciones", href: "/ubicaciones", homeCard: true } },
];

const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function stateOf(p: Promotion, today: string) {
  if (!p.on) return { label: "Off", cls: "bg-cream text-ink-soft border-line" };
  if (p.end && p.end < today) return { label: "Ended", cls: "bg-cream text-ink-soft border-line" };
  if (p.start && p.start > today) return { label: `Starts ${dayLabel(p.start)}`, cls: "bg-sky-50 text-sky-700 border-sky-200" };
  return { label: "● Live now", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
}

export function PromotionsView({ initial }: { initial: Promotion[] }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const today = pacificToday();

  const save = async (next: Promotion[], note: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/promotions", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ promotions: next }) });
      const data = (await res.json().catch(() => ({}))) as { promotions?: Promotion[]; error?: string };
      if (!res.ok || !data.promotions) throw new Error(data.error ?? "Couldn't save");
      setList(data.promotions);
      setSaved(note);
      setTimeout(() => setSaved(""), 3000);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const upsert = async (p: Promotion) => {
    const problem = promotionProblem(p);
    if (problem) return setError(problem);
    const exists = list.some((x) => x.id === p.id);
    if (await save(exists ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list], exists ? "Saved. The website updates in a few seconds." : "Promotion added to the website."))
      setEditing(null);
  };

  const live = list.filter((p) => isRunning(p, today));

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => (setError(""), setEditing(newPromotion()))} className={`${btn.primary} flex items-center gap-2`}>
          <PlusIcon className="w-4 h-4" /> New promotion
        </button>
        <span className="text-sm text-ink-soft">or start from an idea:</span>
        {IDEAS.map((i) => (
          <button key={i.label} onClick={() => (setError(""), setEditing({ ...newPromotion(), ...i.p }))} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-rose">
            {i.label}
          </button>
        ))}
      </div>

      {saved && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">✓ {saved}</p>}
      {error && !editing && <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}

      <p className="text-sm text-ink-soft">
        {live.length ? `${live.length} promotion${live.length > 1 ? "s are" : " is"} on the website right now.` : "Nothing is showing on the website right now."} The top banner shows one at a time (the first one live in this list).
      </p>

      {list.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-hand text-4xl text-rose">No promotions yet</p>
          <p className="mt-2 text-ink-soft">Announce a new drink, a daily special, an event or a change of hours.</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((p) => {
            const s = stateOf(p, today);
            return (
              <Card key={p.id} className={`overflow-hidden ${p.on ? "" : "opacity-70"}`}>
                <div className="flex gap-4 p-4">
                  {p.image ? (
                    <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                      <Image src={p.image} alt="" fill sizes="96px" className="object-cover" />
                    </span>
                  ) : (
                    <span className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-blush font-hand text-4xl text-rose">♡</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-tight">{p.title}</p>
                      <Toggle on={p.on} label={`Show ${p.title}`} disabled={busy} onChange={(on) => save(list.map((x) => (x.id === p.id ? { ...x, on } : x)), on ? "Turned on." : "Turned off. It's hidden from the website.")} />
                    </div>
                    {p.message && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.message}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      <span className={`rounded-full border px-2 py-0.5 font-semibold ${s.cls}`}>{s.label}</span>
                      {p.banner && <span className="rounded-full bg-blush px-2 py-0.5 text-rose">Top banner</span>}
                      {p.homeCard && <span className="rounded-full bg-blush px-2 py-0.5 text-rose">Home page card</span>}
                      {(p.start || p.end) && (
                        <span className="rounded-full bg-cream px-2 py-0.5 text-ink-soft">
                          {p.start ? dayLabel(p.start) : "Now"} – {p.end ? dayLabel(p.end) : "no end"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-line text-sm font-semibold">
                  <button onClick={() => (setError(""), setEditing(p))} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 hover:bg-cream">
                    <PencilIcon className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => save([{ ...p, id: newPromotion().id, title: `${p.title} (copy)`.slice(0, 60), on: false }, ...list], "Copied. The copy starts off.")}
                    disabled={busy}
                    className="flex-1 border-l border-line py-2.5 hover:bg-cream"
                  >
                    Duplicate
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && (
        <Editor
          p={editing}
          isNew={!list.some((x) => x.id === editing.id)}
          busy={busy}
          error={error}
          onChange={setEditing}
          onClose={() => !busy && setEditing(null)}
          onSave={() => upsert(editing)}
          onDelete={async () => {
            if (await save(list.filter((x) => x.id !== editing.id), "Promotion deleted.")) setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Editor({
  p,
  isNew,
  busy,
  error,
  onChange,
  onClose,
  onSave,
  onDelete,
}: {
  p: Promotion;
  isNew: boolean;
  busy: boolean;
  error: string;
  onChange: (p: Promotion) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const set = (patch: Partial<Promotion>) => onChange({ ...p, ...patch });
  const known = LINKS.some((l) => l.href === p.href);
  const [other, setOther] = useState(!!p.href && !known);

  return (
    <Modal
      title={isNew ? "New promotion" : "Edit promotion"}
      onClose={onClose}
      footer={
        <>
          {!isNew &&
            (confirm ? (
              <button onClick={onDelete} disabled={busy} className={`${btn.danger} mr-auto`}>
                Yes, delete it
              </button>
            ) : (
              <button onClick={() => setConfirm(true)} disabled={busy} className={`${btn.ghost} mr-auto`}>
                Delete
              </button>
            ))}
          <button onClick={onClose} disabled={busy} className={btn.ghost}>
            Cancel
          </button>
          <button onClick={onSave} disabled={busy} className={btn.primary}>
            {busy ? "Saving…" : isNew ? "Add to website" : "Save"}
          </button>
        </>
      }
    >
      {/* Live preview of the top banner */}
      <div className="overflow-hidden rounded-xl border border-line">
        <p className="bg-cream px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Preview</p>
        <div className="bg-rose px-4 py-2 text-center text-sm text-white">
          <strong>{p.title || "Your title"}</strong>
          {p.message && <span className="text-white/90"> · {p.message}</span>}
          {p.cta && p.href && <span className="ml-2 inline-block rounded-full bg-white px-3 py-0.5 text-xs font-bold text-rose">{p.cta} →</span>}
        </div>
      </div>

      <Field label="Title" hint="Short, in Spanish. Example: ¡Nuevo! Fresas de Biscoff">
        <input value={p.title} maxLength={60} onChange={(e) => set({ title: e.target.value })} className={field} />
      </Field>
      <Field label="Message (optional)">
        <textarea value={p.message} maxLength={220} rows={2} onChange={(e) => set({ message: e.target.value })} className={field} />
      </Field>

      <div>
        <span className="mb-1 block text-sm font-medium">Where it shows</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["banner", "Top banner", "A pink bar on every page"],
              ["homeCard", "Home page card", "A big card, with photo if you add one"],
            ] as const
          ).map(([key, title, sub]) => (
            <label key={key} className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 ${p[key] ? "border-rose bg-blush/50" : "border-line bg-white"}`}>
              <input type="checkbox" checked={p[key]} onChange={(e) => set({ [key]: e.target.checked })} className="mt-1 accent-rose" />
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-ink-soft">{sub}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Button text">
          <input value={p.cta} maxLength={30} placeholder="Ordena ahora" onChange={(e) => set({ cta: e.target.value })} className={field} />
        </Field>
        <Field label="Button goes to">
          <select
            value={other ? "other" : p.href}
            onChange={(e) => {
              const v = e.target.value;
              setOther(v === "other");
              set({ href: v === "other" ? "" : v, cta: v ? p.cta || "Ordena ahora" : "" });
            }}
            className={field}
          >
            <option value="">No button</option>
            {LINKS.map((l) => (
              <option key={l.href} value={l.href}>
                {l.label}
              </option>
            ))}
            <option value="other">Other link (Instagram post…)</option>
          </select>
        </Field>
      </div>
      {other && (
        <Field label="Link" hint="Starts with https://">
          <input value={p.href} placeholder="https://www.instagram.com/p/…" onChange={(e) => set({ href: e.target.value })} className={field} />
        </Field>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Starts" hint="Empty = right away">
          <input type="date" value={p.start} onChange={(e) => set({ start: e.target.value })} className={field} />
        </Field>
        <Field label="Ends (last day)" hint="Empty = until you turn it off">
          <input type="date" value={p.end} min={p.start || undefined} onChange={(e) => set({ end: e.target.value })} className={field} />
        </Field>
      </div>

      {p.homeCard && (
        <div>
          <span className="mb-1 flex items-center justify-between text-sm font-medium">
            Photo for the home page card (optional)
            {p.image && (
              <button type="button" onClick={() => set({ image: "" })} className="text-xs font-semibold text-rose">
                Remove
              </button>
            )}
          </span>
          <PhotoPicker value={p.image} onChange={(image) => set({ image })} folder="site" aspect="aspect-[16/9]" />
        </div>
      )}

      <label className="flex items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium">
        Show on the website
        <Toggle on={p.on} label="Show on the website" onChange={(on) => set({ on })} />
      </label>

      {error && <p className="text-sm text-rose-700">{error}</p>}
    </Modal>
  );
}
