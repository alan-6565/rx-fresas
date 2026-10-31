"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, Modal, PageHeader, btn } from "@/components/admin/ui";
import { PhotoPicker } from "@/components/admin/PhotoPicker";
import { PlusIcon } from "@/components/admin/icons";

// The real website in a frame, with ✎ on every photo (added by EditLayer
// inside the frame). Picking a new photo uploads it and saves it here, so the
// website pages themselves never need the staff login.

const PAGES = [
  { path: "/", label: "Inicio" },
  { path: "/menu", label: "Menú" },
  { path: "/nosotros", label: "Sobre Nosotros" },
  { path: "/ubicaciones", label: "Ubicaciones" },
  { path: "/galeria", label: "Galería" },
];

const SLOT_LABELS: Record<string, string> = {
  "home.hero": "Home · big photo at the top",
  "home.story": "Home · “Nuestra Historia” photo",
  "about.story": "Sobre Nosotros · main photo",
  "about.1": "Sobre Nosotros · photo 1 of 3",
  "about.2": "Sobre Nosotros · photo 2 of 3",
  "about.3": "Sobre Nosotros · photo 3 of 3",
};
const RESETTABLE = new Set(Object.keys(SLOT_LABELS));

type Editing = { slot: string; src: string };

export default function WebsiteEditor() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [path, setPath] = useState("/");
  const [src, setSrc] = useState("/");
  const [phone, setPhone] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  // Item and spot names, so the dialog says "The Dubai" instead of an id
  useEffect(() => {
    let alive = true;
    Promise.all([fetch("/api/admin/menu").then((r) => r.json()), fetch("/api/admin/locations").then((r) => r.json())])
      .then(([menu, spots]: [{ items?: { id: string; name: string }[] }, { locations?: { id: string; name: string }[] }]) => {
        if (!alive) return;
        const map: Record<string, string> = {};
        for (const i of menu.items ?? []) map[`item:${i.id}`] = `Menu item · ${i.name}`;
        for (const l of spots.locations ?? []) map[`spot:${l.id}`] = `Truck spot · ${l.name}`;
        setNames(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === "rx-page") setPath(e.data.path);
      if (e.data?.type === "rx-edit-photo") {
        setError("");
        setEditing({ slot: String(e.data.slot), src: String(e.data.src || "") });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // The page is rebuilt after a change; the second load picks up the new version
  const reload = useCallback(() => {
    frame.current?.contentWindow?.location.reload();
    setTimeout(() => frame.current?.contentWindow?.location.reload(), 2500);
  }, []);

  const label = (slot: string) =>
    slot === "gallery:add" ? "New gallery photo" : slot.startsWith("gallery:") ? `Galería · photo ${Number(slot.slice(8)) + 1}` : (SLOT_LABELS[slot] ?? names[slot] ?? "Photo");

  const call = async (method: "POST" | "DELETE", body: object) => {
    const res = await fetch("/api/admin/photos", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Couldn't save the photo");
  };

  const save = async (url: string) => {
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      await call("POST", { slot: editing.slot, url });
      if (editing.slot === "gallery:add") reload();
      else frame.current?.contentWindow?.postMessage({ type: "rx-photo-updated", slot: editing.slot, url }, location.origin);
      setSaved(`${label(editing.slot)} updated on the website.`);
      setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      await call("DELETE", { slot: editing.slot });
      setSaved(editing.slot.startsWith("gallery:") ? "Photo removed from the gallery." : `${label(editing.slot)} is back to the original.`);
      setEditing(null);
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Edit Website" sub="Tap ✎ Cambiar foto on any photo to replace it. Changes go live on the website right away.">
        <div className="flex rounded-xl border border-line bg-white p-1 text-sm font-semibold">
          {[
            { on: false, label: "Computer" },
            { on: true, label: "Phone" },
          ].map((d) => (
            <button key={d.label} onClick={() => setPhone(d.on)} className={`rounded-lg px-3 py-1.5 ${phone === d.on ? "bg-rose text-white" : "text-ink-soft"}`}>
              {d.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {PAGES.map((p) => (
          <button
            key={p.path}
            onClick={() => {
              setSrc(`${p.path}?v=${Date.now()}`);
              setPath(p.path);
            }}
            className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium ${path === p.path ? "bg-rose border-rose text-white" : "bg-white border-line hover:border-rose"}`}
          >
            {p.label}
          </button>
        ))}
        {path === "/galeria" && (
          <button onClick={() => setEditing({ slot: "gallery:add", src: "" })} className={`${btn.primary} ml-auto flex items-center gap-2`}>
            <PlusIcon className="w-4 h-4" /> Add photo to gallery
          </button>
        )}
      </div>

      {saved && (
        <p className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-800">
          ✓ {saved}{" "}
          <button onClick={() => setSaved("")} className="underline">
            OK
          </button>
        </p>
      )}

      <Card className="mt-3 overflow-hidden bg-[#e9dcda] p-0">
        <div className={`mx-auto transition-[max-width] ${phone ? "max-w-[400px] py-4" : "max-w-none"}`}>
          <iframe
            ref={frame}
            src={src}
            title="Website preview"
            className={`block w-full bg-cream ${phone ? "h-[760px] rounded-[2rem] border-8 border-ink shadow-xl" : "h-[calc(100dvh-230px)] min-h-[600px]"}`}
          />
        </div>
      </Card>
      <p className="mt-2 text-xs text-ink-soft">Links inside the preview work, so you can also move between pages there. Photos customers see in their cart use the menu item photo.</p>

      {editing && (
        <Modal
          title={editing.slot === "gallery:add" ? "Add to gallery" : "Change photo"}
          onClose={() => !busy && setEditing(null)}
          footer={
            <>
              {(RESETTABLE.has(editing.slot) || (editing.slot.startsWith("gallery:") && editing.slot !== "gallery:add")) && (
                <button onClick={remove} disabled={busy} className={`${btn.danger} mr-auto`}>
                  {editing.slot.startsWith("gallery:") ? "Remove from gallery" : "Use original photo"}
                </button>
              )}
              <button onClick={() => setEditing(null)} disabled={busy} className={btn.ghost}>
                Done
              </button>
            </>
          }
        >
          <p className="text-sm font-semibold">{label(editing.slot)}</p>
          {editing.src && (
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element -- any of the site's photo URLs, shown as-is */}
              <img src={editing.src} alt="Current photo" className="absolute inset-0 h-full w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold">Now</span>
            </div>
          )}
          <PhotoPicker value="" onChange={save} folder={editing.slot.startsWith("item:") ? "menu" : editing.slot.startsWith("spot:") ? "locations" : "site"} aspect="aspect-[3/1]" />
          {busy && <p className="text-sm text-ink-soft">Saving…</p>}
          {error && <p className="text-sm text-rose-700">{error}</p>}
          <p className="text-xs text-ink-soft">Tip: photos from your phone work great. Landscape photos fit best at the top of the home page.</p>
        </Modal>
      )}
    </>
  );
}
