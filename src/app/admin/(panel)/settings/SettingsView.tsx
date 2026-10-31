"use client";

import Image from "next/image";
import { useState } from "react";
import type { BusinessInfo } from "@/lib/business";
import { PHOTO_KINDS, type Answer, type Intake, type PhotoKind } from "@/lib/intake-types";
import { TIME_ZONE } from "@/lib/time";
import { Card, Field, Toggle, btn, field } from "@/components/admin/ui";

const when = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
const yes = (v: Answer) => ({ si: "Yes", no: "No", nose: "Not sure yet", "": "—" })[v];

export function SettingsView({ origin, token: firstToken, intake, info, spotNames }: { origin: string; token: string; intake: Intake; info: BusinessInfo; spotNames: Record<string, string> }) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr] items-start">
      <div className="space-y-6">
        <LinkCard origin={origin} firstToken={firstToken} intake={intake} />
        <Answers intake={intake} spotNames={spotNames} />
        <OwnerPhotos photos={intake.photos} />
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

function Answers({ intake, spotNames }: { intake: Intake; spotNames: Record<string, string> }) {
  const a = intake.answers;
  if (!intake.savedAt) return null;
  const rows: [string, React.ReactNode][] = [
    ["Instagram", a.contact.instagram],
    ["TikTok", a.contact.tiktok],
    ["Facebook", a.contact.facebook],
    ["Phone", a.contact.phone && `${a.contact.phone}${a.contact.showPhone ? "" : " (hidden on the website)"}`],
    ["Email", a.contact.email],
    ...Object.entries(a.spots).map(([id, s]): [string, React.ReactNode] => [
      spotNames[id] ?? "Spot",
      <>
        {s.city || "—"} · hours OK: {yes(s.hoursOk)}
        {s.hoursFix && <span className="mt-1 block whitespace-pre-line rounded-lg bg-amber-50 px-2 py-1">{s.hoursFix}</span>}
      </>,
    ]),
    [
      "Menu & prices OK",
      <>
        {yes(a.menuOk)}
        {a.menuFix && <span className="mt-1 block whitespace-pre-line rounded-lg bg-amber-50 px-2 py-1">{a.menuFix}</span>}
      </>,
    ],
    ["Toppings included", a.toppingsIncluded],
    ["Each extra topping", a.toppingExtra],
    ["More to sell online", a.moreToSell],
    ["Their story", a.story],
    ["Orders into Square", yes(a.square)],
    ["Ticket printer", yes(a.printer)],
    ["Notes", a.notes],
  ];
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">Their answers</h2>
      <dl className="mt-3 divide-y divide-line text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[170px_1fr]">
            <dt className="font-semibold text-ink-soft">{k}</dt>
            <dd className="whitespace-pre-line">{v || <span className="text-ink-soft">—</span>}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function OwnerPhotos({ photos }: { photos: Intake["photos"] }) {
  const [added, setAdded] = useState<Record<string, "busy" | "done" | "error">>({});
  if (!photos.length) return null;

  const toGallery = async (url: string) => {
    setAdded((m) => ({ ...m, [url]: "busy" }));
    const res = await fetch("/api/admin/photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slot: "gallery:add", url }) }).catch(() => null);
    setAdded((m) => ({ ...m, [url]: res?.ok ? "done" : "error" }));
  };

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-lg font-bold">Photos from the owners</h2>
      <p className="mt-1 text-sm text-ink-soft">To use one somewhere else, open Edit Website and tap ✎ on that photo.</p>
      {(Object.keys(PHOTO_KINDS) as PhotoKind[]).map((kind) => {
        const list = photos.filter((p) => p.kind === kind);
        if (!list.length) return null;
        return (
          <div key={kind} className="mt-5">
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
    </Card>
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
