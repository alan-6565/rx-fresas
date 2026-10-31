"use client";

import Image from "next/image";
import { useState } from "react";
import type { BusinessInfo } from "@/lib/business";
import { PHOTO_KINDS, newHours, type Answer, type Intake, type PhotoKind } from "@/lib/intake-types";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/icons";
import { TIME_ZONE } from "@/lib/time";
import { Card, Field, Toggle, btn, field } from "@/components/admin/ui";

const when = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
const yes = (v: Answer) => ({ si: "Yes", no: "No", nose: "Not sure yet", "": "—" })[v];

export function SettingsView({ origin, token: firstToken, intake, info, names }: { origin: string; token: string; intake: Intake; info: BusinessInfo; names: Names }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr] items-start">
      <div className="space-y-6">
        <LinkCard origin={origin} firstToken={firstToken} intake={intake} />
        <ClientAnswers intake={intake} names={names} />
      </div>
      <ContactEditor info={info} />
    </div>
  );
}

function LinkCard({ origin, firstToken, intake }: { origin: string; firstToken: string; intake: Intake }) {
  const [token, setToken] = useState(firstToken);
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const url = `${origin}/bienvenida/${token}`;
  const text = `¡Hola! Aquí pueden contestar unas preguntas para terminar su página ♡ ${url}`;

  const copy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const reset = async () => {
    const res = await fetch("/api/admin/intake", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { token?: string };
    if (data.token) setToken(data.token);
    setConfirmReset(false);
  };

  const status = intake.submittedAt
    ? { label: `Sent ${when(intake.submittedAt)}`, cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : intake.savedAt
      ? { label: `In progress · last saved ${when(intake.savedAt)}`, cls: "bg-amber-50 text-amber-700 border-amber-200" }
      : { label: "Not started", cls: "bg-cream text-ink-soft border-line" };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Owner questionnaire</h2>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>{status.label}</span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Send this link to the owners. It asks for their socials, phone, cities, menu fixes, photos and story, in Spanish, and saves as they go. When they press send, their contact info and cities go on the website automatically.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input readOnly value={url} onFocus={(e) => e.target.select()} aria-label="Questionnaire link" className={`${field} font-mono text-xs`} />
        <div className="flex shrink-0 gap-2">
          <button onClick={copy} className={btn.primary}>
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <a href={`sms:?&body=${encodeURIComponent(text)}`} className={btn.ghost}>
            Text it
          </a>
          <a href={url} target="_blank" rel="noreferrer" className={btn.ghost}>
            Open
          </a>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Anyone with the link can open it.{" "}
        {confirmReset ? (
          <>
            The old link will stop working.{" "}
            <button onClick={reset} className="font-semibold text-rose-700 underline">
              Make a new link
            </button>{" "}
            <button onClick={() => setConfirmReset(false)} className="underline">
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="underline">
            Make a new link
          </button>
        )}
      </p>
    </Card>
  );
}

type Names = { spots: Record<string, string>; categories: Record<string, string> };

function ClientAnswers({ intake, names }: { intake: Intake; names: Names }) {
  const [tab, setTab] = useState<"summary" | "menu" | "hours" | "photos">("summary");
  const a = intake.answers;
  if (!intake.savedAt && !intake.photos.length) return null;

  const changes = [
    ...Object.entries(a.spots)
      .filter(([, s]) => s.hoursOk === "no")
      .map(([id, s]) => ({ what: `Location: ${names.spots[id] ?? "Spot"}`, detail: [newHours(s) && `New hours ${newHours(s)}`, s.hoursFix].filter(Boolean).join(" · ") || "Hours need fixing" })),
    ...(a.newSpot.trim() ? [{ what: "New location", detail: a.newSpot }] : []),
    ...Object.entries(a.menu)
      .filter(([, m]) => m.status === "edit")
      .map(([id, m]) => ({ what: `Menu: ${names.categories[id] ?? id}`, detail: m.fix || "Wants changes" })),
  ];
  const c = a.contact;
  const contact: [React.ReactNode, string][] = [
    [<InstagramIcon key="i" className="w-4 h-4 text-[#d6249f]" />, c.instagram && `@${c.instagram.replace(/^@/, "")}`],
    [<TikTokIcon key="t" className="w-4 h-4" />, c.tiktok && `@${c.tiktok.replace(/^@/, "")}`],
    [<FacebookIcon key="f" className="w-4 h-4 text-[#1877f2]" />, c.facebook],
    ["📞", c.phone && `${c.phone}${c.showPhone ? "  (shown on the website)" : "  (hidden)"}`],
    ["✉️", c.email],
  ];
  const tabs = [
    ["summary", "Summary"],
    ["menu", "Menu"],
    ["hours", "Hours"],
    ["photos", `Photos (${intake.photos.length})`],
  ] as const;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-night px-5 py-4 text-cream sm:px-6">
        <h2 className="font-hand text-3xl leading-none">Client answers</h2>
        <span className="text-right text-xs">
          {intake.submittedAt ? (
            <>
              <span className="font-semibold text-emerald-300">✓ Received</span>
              <span className="block text-cream/60">{when(intake.submittedAt)}</span>
            </>
          ) : (
            <span className="text-amber-200">Still filling it out{intake.savedAt && ` · saved ${when(intake.savedAt)}`}</span>
          )}
        </span>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-[#fbeeec] p-1 text-sm font-semibold">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-lg px-2 py-1.5 ${tab === id ? "bg-white text-rose shadow-sm" : "text-ink-soft"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "summary" && (
          <div className="mt-4 space-y-4">
            <Box title="Contact & socials">
              <ul className="space-y-1.5 text-sm">
                {contact.map(([icon, v], i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="grid w-5 place-items-center text-xs">{icon}</span>
                    {v || <span className="text-ink-soft">—</span>}
                  </li>
                ))}
              </ul>
            </Box>
            <Box title="Requested changes" badge={changes.length ? `${changes.length} change${changes.length > 1 ? "s" : ""}` : undefined}>
              {changes.length ? (
                <ul className="space-y-2 text-sm">
                  {changes.map((ch, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      <span>
                        <span className="font-semibold">{ch.what}</span> <span className="whitespace-pre-line text-ink-soft">– {ch.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-ink-soft">None so far.</p>
              )}
            </Box>
            <Box title="About us & extras">
              <dl className="space-y-2 text-sm">
                <Line k="Their story" v={a.story} />
                <Line k="Orders into Square" v={yes(a.square)} />
                <Line k="Ticket printer" v={yes(a.printer)} />
                <Line k="Notes" v={a.notes} />
              </dl>
            </Box>
            {intake.photos.length > 0 && (
              <Box title={`Photos (${intake.photos.length})`}>
                <div className="flex flex-wrap gap-2">
                  {intake.photos.slice(0, 5).map((p) => (
                    <span key={p.url} className="relative h-16 w-16 overflow-hidden rounded-xl border border-line bg-cream">
                      <Image src={p.url} alt="" fill sizes="64px" className="object-cover" />
                    </span>
                  ))}
                  <button onClick={() => setTab("photos")} className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-line text-center text-[11px] font-semibold leading-tight text-rose hover:border-rose">
                    + Add to
                    <br />
                    gallery
                  </button>
                </div>
              </Box>
            )}
          </div>
        )}

        {tab === "menu" && (
          <div className="mt-4 space-y-4">
            <Box title="Menu check">
              <ul className="divide-y divide-line text-sm">
                {Object.entries(names.categories).map(([id, title]) => {
                  const m = a.menu[id];
                  return (
                    <li key={id} className="py-2">
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{title}</span>
                        {m?.status === "ok" ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">✓ OK</span>
                        ) : m?.status === "edit" ? (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">✎ Change</span>
                        ) : (
                          <span className="text-xs text-ink-soft">Not answered</span>
                        )}
                      </span>
                      {m?.fix && m.status === "edit" && <span className="mt-1 block whitespace-pre-line rounded-lg bg-amber-50 px-2 py-1">{m.fix}</span>}
                    </li>
                  );
                })}
              </ul>
            </Box>
            <Box title="Toppings & more">
              <dl className="space-y-2 text-sm">
                <Line k="Toppings included" v={a.toppingsIncluded} />
                <Line k="Each extra topping" v={a.toppingExtra} />
                <Line k="More to sell online" v={a.moreToSell} />
              </dl>
            </Box>
          </div>
        )}

        {tab === "hours" && (
          <div className="mt-4 space-y-3">
            {Object.entries(a.spots).map(([id, s]) => (
              <Box key={id} title={names.spots[id] ?? "Spot"} badge={s.hoursOk === "si" ? "✓ Hours OK" : s.hoursOk === "no" ? "Fix hours" : undefined} good={s.hoursOk === "si"}>
                <dl className="space-y-2 text-sm">
                  <Line k="City" v={s.city} />
                  {s.hoursOk === "no" && <Line k="Correct hours" v={newHours(s)} />}
                  {s.hoursFix && <Line k="Note" v={s.hoursFix} />}
                </dl>
              </Box>
            ))}
            {a.newSpot.trim() && (
              <Box title="New location" badge="New">
                <p className="whitespace-pre-line text-sm">{a.newSpot}</p>
              </Box>
            )}
          </div>
        )}

        {tab === "photos" && <OwnerPhotos photos={intake.photos} />}

        <p className="mt-4 text-xs text-ink-soft">ⓘ Logo and menu photos wait for you to apply them. To put any photo somewhere specific, use Edit Website.</p>
      </div>
    </Card>
  );
}

function Box({ title, badge, good, children }: { title: string; badge?: string; good?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <p className="font-bold">{title}</p>
        {badge && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${good ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[150px_1fr]">
      <dt className="text-ink-soft">{k}</dt>
      <dd className="whitespace-pre-line">{v || <span className="text-ink-soft">—</span>}</dd>
    </div>
  );
}

function OwnerPhotos({ photos }: { photos: Intake["photos"] }) {
  const [added, setAdded] = useState<Record<string, "busy" | "done" | "error">>({});
  if (!photos.length) return <p className="mt-4 text-sm text-ink-soft">No photos yet.</p>;

  const toGallery = async (url: string) => {
    setAdded((m) => ({ ...m, [url]: "busy" }));
    const res = await fetch("/api/admin/photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot: "gallery:add", url }) }).catch(() => null);
    setAdded((m) => ({ ...m, [url]: res?.ok ? "done" : "error" }));
  };

  return (
    <div className="mt-2">
      {(Object.keys(PHOTO_KINDS) as PhotoKind[]).map((kind) => {
        const list = photos.filter((p) => p.kind === kind);
        if (!list.length) return null;
        return (
          <div key={kind} className="mt-4">
            <p className="text-sm font-semibold">
              {PHOTO_KINDS[kind]} <span className="font-normal text-ink-soft">({list.length})</span>
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => (
                <div key={p.url} className="overflow-hidden rounded-xl border border-line bg-white">
                  <a href={p.url} target="_blank" rel="noreferrer" className="relative block aspect-square bg-cream">
                    <Image src={p.url} alt="" fill sizes="220px" className={kind === "logo" || kind === "menu" ? "object-contain" : "object-cover"} />
                  </a>
                  {kind !== "logo" && kind !== "menu" && (
                    <button onClick={() => toGallery(p.url)} disabled={!!added[p.url] && added[p.url] !== "error"} className="w-full py-2 text-xs font-semibold text-rose hover:bg-blush disabled:text-ink-soft">
                      {added[p.url] === "busy" ? "Adding…" : added[p.url] === "done" ? "In the gallery ✓" : added[p.url] === "error" ? "Try again" : "+ Add to gallery"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ContactEditor({ info }: { info: BusinessInfo }) {
  const [v, setV] = useState(info);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/business", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { info?: BusinessInfo; error?: string } | undefined;
    if (res?.ok && data?.info) {
      setV(data.info);
      setMsg({ ok: true, text: "Saved. The website shows it now." });
    } else setMsg({ ok: false, text: data?.error ?? "Couldn't save" });
    setBusy(false);
  };

  const text = (key: "instagram" | "tiktok" | "facebook" | "phone" | "email", label: string, placeholder: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <input value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} placeholder={placeholder} className={field} />
    </Field>
  );

  return (
    <Card className="p-5 sm:p-6 xl:sticky xl:top-6">
      <h2 className="text-lg font-bold">Contact & socials</h2>
      <p className="mt-1 text-sm text-ink-soft">Shown in the navbar, footer and Contacto page. Empty ones are hidden.</p>
      <div className="mt-4 space-y-4">
        {text("instagram", "Instagram", "rx_fresasconcrema", "Just the handle, or paste their profile link")}
        {text("tiktok", "TikTok", "rx_fresasconcrema")}
        {text("facebook", "Facebook page", "https://www.facebook.com/…")}
        {text("phone", "Phone", "(510) 555-1234")}
        <label className="flex items-center gap-3 text-sm">
          <Toggle on={v.showPhone} onChange={(showPhone) => setV({ ...v, showPhone })} label="Show the phone on the website" />
          Show the phone on the website
        </label>
        {text("email", "Email", "hola@…")}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button onClick={save} disabled={busy} className={btn.primary}>
          {busy ? "Saving…" : "Save"}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>{msg.text}</p>}
      </div>
    </Card>
  );
}
