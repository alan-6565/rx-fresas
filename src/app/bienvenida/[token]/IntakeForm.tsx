"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Answer, Intake, IntakeAnswers, IntakePhoto, PhotoKind } from "@/lib/intake-types";
import { shrink } from "@/lib/shrink";
import { HeartDoodle, StrawberryIcon } from "@/components/icons";

export type SpotReview = { id: string; name: string; address: string; city: string; hours: string[] };
export type MenuReview = { title: string; items: { name: string; price: string; options: string[] }[] };

type Problems = Partial<Record<"instagram" | "tiktok" | "facebook" | "phone" | "email", string>>;
type Status = "idle" | "saving" | "saved" | "error";

const input = "w-full rounded-2xl border border-line bg-white px-4 py-3 text-base focus:outline-none focus:border-rose";
const CITIES = ["Richmond", "San Pablo", "El Sobrante"];

export function IntakeForm({ token, initial, spots, menu }: { token: string; initial: Intake; spots: SpotReview[]; menu: MenuReview[] }) {
  const [a, setA] = useState<IntakeAnswers>(() => ({
    ...initial.answers,
    // Each spot starts with the city the website shows now
    spots: Object.fromEntries(spots.map((s) => [s.id, initial.answers.spots[s.id] ?? { city: s.city.replace(/, CA$/, ""), hoursOk: "" as Answer, hoursFix: "" }])),
  }));
  const [photos, setPhotos] = useState<IntakePhoto[]>(initial.photos);
  const [status, setStatus] = useState<Status>("idle");
  const [submittedAt, setSubmittedAt] = useState(initial.submittedAt);
  const [sending, setSending] = useState(false);
  const [problems, setProblems] = useState<Problems>({});
  const [error, setError] = useState("");
  const edited = useRef(false);

  const set = (patch: Partial<IntakeAnswers>) => {
    edited.current = true;
    setA((prev) => ({ ...prev, ...patch }));
  };
  const setContact = (patch: Partial<IntakeAnswers["contact"]>) => set({ contact: { ...a.contact, ...patch } });
  const setSpot = (id: string, patch: Partial<IntakeAnswers["spots"][string]>) => set({ spots: { ...a.spots, [id]: { ...a.spots[id], ...patch } } });

  const post = (submit: boolean) =>
    fetch(`/api/intake/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: a, submit }) });

  // Saves a draft a moment after they stop typing, so nothing is lost
  useEffect(() => {
    if (!edited.current) return;
    const t = setTimeout(() => {
      setStatus("saving");
      post(false)
        .then((r) => setStatus(r.ok ? "saved" : "error"))
        .catch(() => setStatus("error"));
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save whenever the answers change
  }, [a]);

  const send = async () => {
    setSending(true);
    setError("");
    try {
      const res = await post(true);
      const data = (await res.json().catch(() => ({}))) as { error?: string; problems?: Problems };
      if (!res.ok) {
        setProblems(data.problems ?? {});
        setError(data.error ?? "No se pudo enviar. Intenta otra vez.");
        document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      setProblems({});
      setSubmittedAt(new Date().toISOString());
      setStatus("saved");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Sin conexión. Intenta otra vez.");
    } finally {
      setSending(false);
    }
  };

  const has = (kind: PhotoKind) => photos.some((p) => p.kind === kind);
  const done = {
    contacto: !!a.contact.instagram.trim() && !!(a.contact.phone.trim() || a.contact.email.trim()),
    ubicaciones: spots.every((s) => a.spots[s.id]?.city.trim() && a.spots[s.id]?.hoursOk),
    menu: !!a.menuOk && !!a.toppingsIncluded.trim(),
    fotos: has("logo") && photos.length > 1,
    historia: a.story.trim().length > 20,
    extras: !!a.square && !!a.printer,
  };
  const count = Object.values(done).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-cream pb-32">
      <header className="relative overflow-hidden bg-blush px-4 pb-10 pt-10 text-center">
        <HeartDoodle className="absolute left-5 top-6 w-10 h-10 text-rose/30 -rotate-12" />
        <StrawberryIcon className="absolute right-5 bottom-4 w-12 h-12 text-rose/30 rotate-12" />
        <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-full bg-cream shadow-lg ring-4 ring-white">
          <Image src="/images/logo-v2.png" alt="R&X Fresas con Crema" fill sizes="96px" className="object-cover" priority />
        </div>
        <h1 className="mt-4 font-hand text-5xl leading-none">¡Hola, R&X! ♡</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Con estas respuestas terminamos su página. Todo se guarda solo, así que pueden contestar poco a poco y regresar a este mismo link cuando quieran.
        </p>
        <div className="mx-auto mt-5 max-w-xs">
          <div className="h-2.5 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-rose transition-all" style={{ width: `${(count / 6) * 100}%` }} />
          </div>
          <p className="mt-1.5 text-sm font-semibold text-rose">{count} de 6 secciones listas</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-5 px-4 pt-6">
        {submittedAt && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <p className="font-bold">¡Gracias! Recibimos sus respuestas ♡</p>
            <p className="mt-1 text-sm">Sus redes, teléfono y ciudades ya están en la página. Si cambian algo aquí, presionen “Enviar cambios” otra vez.</p>
          </div>
        )}

        <Section id="contacto" n={1} title="Contacto y redes" done={done.contacto} sub="Esto aparece en la página para que sus clientes los encuentren.">
          <Text label="Instagram" value={a.contact.instagram} onChange={(v) => setContact({ instagram: v })} placeholder="@rx_fresasconcrema" error={problems.instagram} />
          <Text label="TikTok" value={a.contact.tiktok} onChange={(v) => setContact({ tiktok: v })} placeholder="@usuario (si tienen)" error={problems.tiktok} />
          <Text label="Facebook" value={a.contact.facebook} onChange={(v) => setContact({ facebook: v })} placeholder="Link de su página (si tienen)" error={problems.facebook} />
          <Text label="Teléfono" type="tel" value={a.contact.phone} onChange={(v) => setContact({ phone: v })} placeholder="(510) 555-1234" error={problems.phone} />
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3 text-sm">
            <span>Mostrar el teléfono en la página</span>
            <input type="checkbox" checked={a.contact.showPhone} onChange={(e) => setContact({ showPhone: e.target.checked })} className="h-5 w-5 accent-rose" />
          </label>
          <Text label="Correo" type="email" value={a.contact.email} onChange={(v) => setContact({ email: v })} placeholder="correo@ejemplo.com" error={problems.email} />
        </Section>

        <Section n={2} title="Ubicaciones" done={done.ubicaciones} sub="Así aparecen ahorita en la página. Confirmen la ciudad y el horario.">
          {spots.map((s) => {
            const v = a.spots[s.id];
            return (
              <div key={s.id} className="rounded-2xl border border-line bg-cream/60 p-4">
                <p className="font-bold">{s.name}</p>
                {s.address && <p className="text-sm text-ink-soft">{s.address}</p>}
                <ul className="mt-2 text-sm">
                  {s.hours.map((h) => (
                    <li key={h}>🕒 {h}</li>
                  ))}
                </ul>
                <p className="mb-1.5 mt-4 text-sm font-semibold">¿En qué ciudad está?</p>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((c) => (
                    <Chip key={c} on={v.city === c} onClick={() => setSpot(s.id, { city: c })}>
                      {c}
                    </Chip>
                  ))}
                </div>
                <input value={v.city} onChange={(e) => setSpot(s.id, { city: e.target.value })} placeholder="Otra ciudad" aria-label={`Ciudad de ${s.name}`} className={`${input} mt-2`} />
                <YesNo label="¿El horario está bien?" value={v.hoursOk} onChange={(hoursOk) => setSpot(s.id, { hoursOk })} />
                {v.hoursOk === "no" && (
                  <Area value={v.hoursFix} onChange={(hoursFix) => setSpot(s.id, { hoursFix })} placeholder="¿Cuál es el horario correcto? Ej: lunes a sábado de 9 a 2" />
                )}
              </div>
            );
          })}
        </Section>

        <Section n={3} title="Menú" done={done.menu} sub="Esto es lo que se puede pedir en línea ahorita.">
          <div className="space-y-4 rounded-2xl border border-line bg-cream/60 p-4">
            {menu.map((c) => (
              <div key={c.title}>
                <p className="font-hand text-2xl text-rose">{c.title}</p>
                <ul className="mt-1 space-y-1.5">
                  {c.items.map((i) => (
                    <li key={i.name} className="text-sm">
                      <span className="flex justify-between gap-3 font-semibold">
                        <span>{i.name}</span>
                        <span>{i.price}</span>
                      </span>
                      {i.options.map((o) => (
                        <span key={o} className="block text-xs text-ink-soft">
                          {o}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <YesNo label="¿Los productos y precios están bien?" value={a.menuOk} onChange={(menuOk) => set({ menuOk })} />
          {a.menuOk === "no" && <Area value={a.menuFix} onChange={(menuFix) => set({ menuFix })} placeholder="¿Qué hay que cambiar? Ej: The Dubai 16oz cuesta $13" />}
          <Text label="¿Cuántos toppings vienen incluidos en las fresas?" value={a.toppingsIncluded} onChange={(v) => set({ toppingsIncluded: v })} placeholder="Ej: 2" />
          <Text label="¿Cuánto cuesta cada topping extra?" value={a.toppingExtra} onChange={(v) => set({ toppingExtra: v })} placeholder="Ej: $0.50" />
          <div>
            <p className="mb-1 text-sm font-semibold">¿Falta un menú? Súbanlo aquí</p>
            <p className="mb-2 text-xs text-ink-soft">Una foto o captura de pantalla está bien.</p>
            <Photos kind="menu" token={token} photos={photos} setPhotos={setPhotos} />
          </div>
          <Area label="¿Algo más que quieran vender en línea?" value={a.moreToSell} onChange={(moreToSell) => set({ moreToSell })} placeholder="Ej: cafés, especiales de temporada…" />
        </Section>

        <Section n={4} title="Fotos" done={done.fotos} sub="Fotos de celular están perfectas. Entre más, mejor ♡">
          <PhotoBlock title="Su logo" hint="El archivo original, si lo tienen (mejor si es PNG sin fondo).">
            <Photos kind="logo" token={token} photos={photos} setPhotos={setPhotos} />
          </PhotoBlock>
          <PhotoBlock title="El truck" hint="De día, de frente y con el letrero.">
            <Photos kind="truck" token={token} photos={photos} setPhotos={setPhotos} />
          </PhotoBlock>
          <PhotoBlock title="Sus fresas, pancakes y bebidas" hint="Para el menú y la galería.">
            <Photos kind="food" token={token} photos={photos} setPhotos={setPhotos} />
          </PhotoBlock>
          <PhotoBlock title="Ustedes" hint="Para “Sobre Nosotros”, solo si quieren salir.">
            <Photos kind="team" token={token} photos={photos} setPhotos={setPhotos} />
          </PhotoBlock>
        </Section>

        <Section n={5} title="Su historia" done={done.historia} sub="Para la sección “Sobre Nosotros”. Escríbanlo como lo platicarían, nosotros lo acomodamos.">
          <Area
            value={a.story}
            onChange={(story) => set({ story })}
            rows={6}
            placeholder="¿Cómo empezó R&X? ¿Qué significa el nombre? ¿Qué hace especiales sus fresas?"
          />
        </Section>

        <Section n={6} title="Extras" done={done.extras}>
          <YesNo label="¿Quieren que los pedidos de la página también aparezcan en su Square?" value={a.square} onChange={(square) => set({ square })} unsure />
          <YesNo label="¿Quieren una impresora para imprimir los tickets de los pedidos?" value={a.printer} onChange={(printer) => set({ printer })} unsure />
          <Area label="¿Algo más que nos quieran decir?" value={a.notes} onChange={(notes) => set({ notes })} placeholder="Ideas, cambios, preguntas…" />
        </Section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <span className="min-w-0 flex-1 text-sm text-ink-soft">
            {error ? (
              <span className="text-rose-dark">{error}</span>
            ) : status === "saving" ? (
              "Guardando…"
            ) : status === "error" ? (
              <span className="text-rose-dark">No se guardó, revisen su conexión</span>
            ) : status === "saved" ? (
              "Guardado ✓"
            ) : (
              "Se guarda solo"
            )}
          </span>
          <button onClick={send} disabled={sending} className="shrink-0 rounded-full bg-rose px-6 py-3.5 font-bold text-white shadow-md hover:bg-rose-dark disabled:opacity-60">
            {sending ? "Enviando…" : submittedAt ? "Enviar cambios" : "Enviar respuestas ♡"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ id, n, title, sub, done, children }: { id?: string; n: number; title: string; sub?: string; done: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-4 rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-3 text-xl font-bold">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm text-white ${done ? "bg-emerald-500" : "bg-rose"}`}>{done ? "✓" : n}</span>
        {title}
      </h2>
      {sub && <p className="mt-1.5 text-sm text-ink-soft">{sub}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Text({ label, value, onChange, placeholder, type = "text", error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${input} ${error ? "border-rose" : ""}`} />
      {error && <span className="mt-1 block text-sm text-rose-dark">{error}</span>}
    </label>
  );
}

function Area({ label, value, onChange, placeholder, rows = 3 }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-semibold">{label}</span>}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} aria-label={label ?? placeholder} className={input} />
    </label>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${on ? "border-rose bg-rose text-white" : "border-line bg-white hover:border-rose"}`}
    >
      {children}
    </button>
  );
}

function YesNo({ label, value, onChange, unsure }: { label: string; value: Answer; onChange: (v: Answer) => void; unsure?: boolean }) {
  const opts: [Answer, string][] = [
    ["si", "Sí"],
    ["no", "No"],
    ...(unsure ? ([["nose", "No sé todavía"]] as [Answer, string][]) : []),
  ];
  return (
    <div className="pt-1">
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-2">
        {opts.map(([v, text]) => (
          <Chip key={v} on={value === v} onClick={() => onChange(value === v ? "" : v)}>
            {text}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function PhotoBlock({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-cream/60 p-4">
      <p className="font-semibold">{title}</p>
      <p className="mb-3 text-xs text-ink-soft">{hint}</p>
      {children}
    </div>
  );
}

/** Logos keep their see-through background; everything else is shrunk to a JPEG */
async function prepare(file: File, kind: PhotoKind): Promise<File> {
  if (kind === "logo") {
    const ok = ["image/png", "image/jpeg", "image/webp"].includes(file.type) && file.size < 3.8 * 1024 * 1024;
    return ok ? file : shrink(file, 1600, "image/png");
  }
  return shrink(file, kind === "menu" ? 2200 : 1600);
}

function Photos({ kind, token, photos, setPhotos }: { kind: PhotoKind; token: string; photos: IntakePhoto[]; setPhotos: React.Dispatch<React.SetStateAction<IntakePhoto[]>> }) {
  const picker = useRef<HTMLInputElement>(null);
  const [left, setLeft] = useState(0);
  const [error, setError] = useState("");
  const mine = photos.filter((p) => p.kind === kind);

  // One at a time, so a slow connection doesn't time out on a big batch
  const upload = async (files: File[]) => {
    setError("");
    setLeft(files.length);
    for (const file of files) {
      try {
        const form = new FormData();
        form.append("file", await prepare(file, kind));
        form.append("kind", kind);
        const res = await fetch(`/api/intake/${token}/upload`, { method: "POST", body: form });
        const data = (await res.json().catch(() => ({}))) as { photo?: IntakePhoto; error?: string };
        if (!res.ok || !data.photo) throw new Error(data.error ?? "No se pudo subir la foto.");
        setPhotos((prev) => [...prev, data.photo!]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
      }
      setLeft((n) => n - 1);
    }
    if (picker.current) picker.current.value = "";
  };

  const remove = async (url: string) => {
    setPhotos((prev) => prev.filter((p) => p.url !== url));
    await fetch(`/api/intake/${token}/upload`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) }).catch(() => {});
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {mine.map((p) => (
          <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl border border-line bg-white">
            <Image src={p.url} alt="" fill sizes="160px" className={kind === "logo" || kind === "menu" ? "object-contain" : "object-cover"} />
            <button
              type="button"
              onClick={() => remove(p.url)}
              aria-label="Quitar foto"
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-lg leading-none shadow"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => picker.current?.click()}
          disabled={left > 0}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-rose/40 bg-white text-sm font-semibold text-rose hover:border-rose disabled:opacity-60"
        >
          <span className="text-3xl leading-none">{left > 0 ? "…" : "+"}</span>
          {left > 0 ? `Subiendo ${left}` : "Agregar"}
        </button>
      </div>
      <input ref={picker} type="file" accept="image/*" multiple={kind !== "logo"} className="hidden" onChange={(e) => upload(Array.from(e.target.files ?? []))} />
      {error && <p className="mt-2 text-sm text-rose-dark">{error}</p>}
    </div>
  );
}
