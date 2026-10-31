"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DAY_CHOICES, type Answer, type Intake, type IntakeAnswers, type IntakePhoto, type MenuAnswer, type PhotoKind, type SpotAnswer } from "@/lib/intake-types";
import { formatTime } from "@/lib/schedule";
import { shrink } from "@/lib/shrink";
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon, FacebookIcon, HeartDoodle, InstagramIcon, PinIcon, StrawberryIcon, TikTokIcon } from "@/components/icons";

// The owners' questionnaire, one section per screen like their mockup
// ("R&X Strawberry Cream Questionnaire Showcase"). Saves as they type.

export type SpotReview = { id: string; name: string; address: string; city: string; hours: string[]; start: string; end: string };
export type MenuReview = { id: string; title: string; image: string; price: string; items: { name: string; price: string; options: string[] }[] };

type Problems = Partial<Record<"instagram" | "tiktok" | "facebook" | "phone" | "email", string>>;
type Status = "idle" | "saving" | "saved" | "error";

const input = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:border-rose";
const CITIES = ["Richmond", "San Pablo", "El Sobrante"];
const TOTAL = 5;
// Every half hour from 5:00 a.m. to 11:30 p.m.
const TIMES = Array.from({ length: 38 }, (_, i) => {
  const m = 300 + i * 30;
  return { value: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`, label: formatTime(m) };
});

export function IntakeForm({ token, initial, spots, menu }: { token: string; initial: Intake; spots: SpotReview[]; menu: MenuReview[] }) {
  const [a, setA] = useState<IntakeAnswers>(() => ({
    ...initial.answers,
    // Each spot starts with the city and hours the website shows now
    spots: Object.fromEntries(
      spots.map((s) => [s.id, initial.answers.spots[s.id] ?? { city: s.city.replace(/, CA$/, ""), hoursOk: "" as Answer, days: "", start: s.start, end: s.end, hoursFix: "" }]),
    ),
  }));
  const [photos, setPhotos] = useState<IntakePhoto[]>(initial.photos);
  const [step, setStep] = useState(0); // 0 = welcome, 1–5 = sections, 6 = thanks
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
  const setSpot = (id: string, patch: Partial<SpotAnswer>) => set({ spots: { ...a.spots, [id]: { ...a.spots[id], ...patch } } });
  const menuAnswer = (id: string): MenuAnswer => a.menu[id] ?? { status: "", fix: "" };
  const setMenu = (id: string, patch: Partial<MenuAnswer>) => set({ menu: { ...a.menu, [id]: { ...menuAnswer(id), ...patch } } });

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

  const go = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  const send = async () => {
    setSending(true);
    setError("");
    try {
      const res = await post(true);
      const data = (await res.json().catch(() => ({}))) as { error?: string; problems?: Problems };
      if (!res.ok) {
        setProblems(data.problems ?? {});
        setError(data.error ?? "No se pudo enviar. Intenta otra vez.");
        if (data.problems) go(1);
        return;
      }
      setProblems({});
      setSubmittedAt(new Date().toISOString());
      setStatus("saved");
      go(6);
    } catch {
      setError("Sin conexión. Intenta otra vez.");
    } finally {
      setSending(false);
    }
  };

  const has = (kind: PhotoKind) => photos.some((p) => p.kind === kind);
  const done = [
    !!a.contact.instagram.trim() && !!(a.contact.phone.trim() || a.contact.email.trim()),
    spots.every((s) => a.spots[s.id]?.city.trim() && a.spots[s.id]?.hoursOk),
    menu.every((c) => menuAnswer(c.id).status) && !!a.toppingsIncluded,
    has("logo") && photos.length > 1,
    a.story.trim().length > 20,
  ];
  const count = done.filter(Boolean).length;
  const firstOpen = done.findIndex((d) => !d) + 1 || 1;
  const photoProps = { token, photos, setPhotos };

  if (step === 0) return <Welcome started={!!initial.savedAt} onStart={() => go(initial.savedAt ? firstOpen : 1)} />;
  if (step === 6) return <Thanks onReview={() => go(1)} />;

  return (
    <Shell>
      <div className="flex items-center gap-3 border-b border-line pb-4">
        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow">
          <Image src="/images/logo-v2.png" alt="" fill sizes="44px" className="object-cover" />
        </span>
        <p className="flex-1 font-hand text-2xl leading-none sm:text-3xl">Cuestionario R&X</p>
        <p className="text-right text-xs text-ink-soft">
          <span className="font-semibold text-rose">{count}</span> de {TOTAL} secciones listas
        </p>
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-ink-soft">
        <span className="shrink-0">
          Sección {step} de {TOTAL}
        </span>
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-blush">
          <span className="block h-full rounded-full bg-gradient-to-r from-rose-soft to-rose transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </span>
        <span className="w-9 shrink-0 text-right">{Math.round((step / TOTAL) * 100)}%</span>
      </div>

      {step === 1 && (
        <Section icon={<MailIcon />} title="Contacto y Redes Sociales" sub="Información principal y redes que se mostrarán en su sitio web.">
          <div className="divide-y divide-line/70">
            <Row icon={<InstagramIcon className="w-5 h-5 text-[#d6249f]" />} label="Instagram" error={problems.instagram}>
              <input aria-label="Instagram" value={a.contact.instagram} onChange={(e) => setContact({ instagram: e.target.value })} placeholder="@rx_fresasconcrema" className={input} />
            </Row>
            <Row icon={<TikTokIcon className="w-5 h-5" />} label="TikTok" error={problems.tiktok}>
              <input aria-label="TikTok" value={a.contact.tiktok} onChange={(e) => setContact({ tiktok: e.target.value })} placeholder="@usuario (si tienen)" className={input} />
            </Row>
            <Row icon={<FacebookIcon className="w-5 h-5 text-[#1877f2]" />} label="Facebook" error={problems.facebook}>
              <input aria-label="Facebook" value={a.contact.facebook} onChange={(e) => setContact({ facebook: e.target.value })} placeholder="Link de su página (si tienen)" className={input} />
            </Row>
            <Row icon={<PhoneIcon />} label="Teléfono" error={problems.phone}>
              <div className="flex flex-wrap items-center gap-3">
                <input type="tel" aria-label="Teléfono" value={a.contact.phone} onChange={(e) => setContact({ phone: e.target.value })} placeholder="(510) 123-4567" className={`${input} min-w-0 flex-1 basis-40`} />
                <label className="flex shrink-0 items-center gap-2 text-sm">
                  <Switch on={a.contact.showPhone} onChange={(showPhone) => setContact({ showPhone })} label="Mostrar en el sitio web" />
                  Mostrar en el sitio web
                </label>
              </div>
            </Row>
            <Row icon={<MailIcon className="w-5 h-5 text-rose" />} label="Correo Electrónico" error={problems.email}>
              <input type="email" aria-label="Correo Electrónico" value={a.contact.email} onChange={(e) => setContact({ email: e.target.value })} placeholder="correo@ejemplo.com" className={input} />
            </Row>
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section icon={<PinIcon className="w-8 h-8" />} title="Ubicaciones y Horarios" sub="Revisa cada ubicación y confirma si el horario está correcto.">
          <div className="space-y-3">
            {spots.map((s) => {
              const v = a.spots[s.id];
              return (
                <div key={s.id} className="rounded-2xl border border-line bg-white p-4">
                  <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                    <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 text-xs font-bold ${v.hoursOk ? "border-rose bg-rose text-white" : "border-rose/40 text-transparent"}`}>✓</span>
                    <div className="min-w-0 flex-1 basis-40">
                      <p className="font-hand text-2xl leading-none">{s.name}</p>
                      {s.address && <p className="mt-1 text-xs text-ink-soft">{s.address}</p>}
                    </div>
                    <div className="basis-full space-y-0.5 text-sm sm:basis-auto">
                      {s.hours.map((h) => (
                        <p key={h} className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-ink-soft" /> {h}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 pl-0 sm:pl-10">
                    <Pill on={v.hoursOk === "si"} tone="green" onClick={() => setSpot(s.id, { hoursOk: v.hoursOk === "si" ? "" : "si" })}>
                      ✓ Horario correcto
                    </Pill>
                    <Pill on={v.hoursOk === "no"} tone="rose" onClick={() => setSpot(s.id, { hoursOk: v.hoursOk === "no" ? "" : "no" })}>
                      ✎ Corregir horario
                    </Pill>
                  </div>
                  {v.hoursOk === "no" && (
                    <div className="mt-3 rounded-xl bg-cream/70 p-3 sm:ml-10">
                      <p className="mb-2 text-sm font-semibold">Horario correcto</p>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:grid-cols-[1.3fr_1fr_auto_1fr]">
                        <select value={v.days} onChange={(e) => setSpot(s.id, { days: e.target.value })} aria-label="Días" className={`${input} col-span-3 sm:col-span-1`}>
                          <option value="">Días…</option>
                          {DAY_CHOICES.map((d) => (
                            <option key={d}>{d}</option>
                          ))}
                          <option>Otro (escribir abajo)</option>
                        </select>
                        <TimeSelect value={v.start} onChange={(start) => setSpot(s.id, { start })} label="Abre" />
                        <span className="text-sm text-ink-soft">a</span>
                        <TimeSelect value={v.end} onChange={(end) => setSpot(s.id, { end })} label="Cierra" />
                      </div>
                      <input value={v.hoursFix} onChange={(e) => setSpot(s.id, { hoursFix: e.target.value })} placeholder="¿Algo más? Ej: cerramos los martes" className={`${input} mt-2`} />
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 sm:pl-10">
                    <span className="text-xs font-semibold text-ink-soft">Ciudad:</span>
                    {CITIES.map((c) => (
                      <Pill key={c} on={v.city === c} tone="rose" small onClick={() => setSpot(s.id, { city: c })}>
                        {c}
                      </Pill>
                    ))}
                    {!CITIES.includes(v.city) && (
                      <input value={v.city} onChange={(e) => setSpot(s.id, { city: e.target.value })} placeholder="Otra" aria-label={`Ciudad de ${s.name}`} className={`${input} w-32 py-1.5`} />
                    )}
                  </div>
                </div>
              );
            })}
            <NewSpot value={a.newSpot} onChange={(newSpot) => set({ newSpot })} />
          </div>
        </Section>
      )}

      {step === 3 && (
        <Section icon={<UtensilsIcon />} title="Menú y Opciones" sub="Revisa tu menú actual, precios y opciones. Puedes confirmar si está bien o hacer cambios.">
          <div className="divide-y divide-line/70 rounded-2xl border border-line bg-white">
            {menu.map((c) => (
              <MenuRow key={c.id} cat={c} value={menuAnswer(c.id)} onChange={(patch) => setMenu(c.id, patch)} />
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-blush/70 p-4">
            <p className="flex items-center gap-2 font-hand text-2xl">
              <StrawberryIcon className="w-6 h-6 text-rose" /> Toppings
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block">¿Cuántos toppings incluye?</span>
                <select value={a.toppingsIncluded} onChange={(e) => set({ toppingsIncluded: e.target.value })} className={input}>
                  <option value="">Elegir…</option>
                  {["0", "1", "2", "3", "4", "5", "Sin límite"].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block">Precio por topping extra</span>
                <select value={a.toppingExtra} onChange={(e) => set({ toppingExtra: e.target.value })} className={input}>
                  <option value="">Elegir…</option>
                  {["$0.50", "$0.75", "$1.00", "$1.25", "$1.50", "$2.00", "No cobramos extra"].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-sm font-semibold">Sube tu menú (si falta alguna parte)</p>
              <Photos kind="menu" dropzone {...photoProps} />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">¿Hay otro producto o idea que te gustaría vender?</span>
              <textarea value={a.moreToSell} onChange={(e) => set({ moreToSell: e.target.value })} rows={4} placeholder="Ej. aguas frescas, postres, combos, etc." className={input} />
            </label>
          </div>
        </Section>
      )}

      {step === 4 && (
        <Section icon={<PictureIcon />} title="Fotos del negocio" sub="Sube las fotos que usaremos en el sitio web. Las fotos del teléfono se optimizan automáticamente.">
          <div className="grid gap-3 sm:grid-cols-2">
            <PhotoBlock title="Logo" hint="El archivo original, mejor si es PNG sin fondo.">
              <Photos kind="logo" {...photoProps} />
            </PhotoBlock>
            <PhotoBlock title="Camión / Truck" hint="De día, de frente y con el letrero.">
              <Photos kind="truck" {...photoProps} />
            </PhotoBlock>
            <PhotoBlock title="Productos (comida y bebidas)" hint="Para el menú y la galería.">
              <Photos kind="food" {...photoProps} />
            </PhotoBlock>
            <PhotoBlock title="Dueños / Equipo" hint="Para “Sobre Nosotros”, solo si quieren salir.">
              <Photos kind="team" {...photoProps} />
            </PhotoBlock>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs text-ink-soft">
            <span className="text-emerald-600">✓</span> Las fotos se comprimen automáticamente para una carga más rápida. El logo mantiene su fondo transparente.
          </p>
        </Section>
      )}

      {step === 5 && (
        <>
          <Section icon={<BookIcon />} title="Sobre Nosotros y Extras" sub="Cuéntanos la historia de R&X. ¿Cómo comenzó, qué los inspira y qué los hace especiales?">
            <textarea value={a.story} onChange={(e) => set({ story: e.target.value })} rows={6} placeholder="Escribe aquí la historia de su negocio… Como lo platicarían, nosotros lo acomodamos." className={input} />
          </Section>
          <div className="mt-7 flex items-center gap-3">
            <GearIcon />
            <h3 className="font-hand text-3xl leading-none">Extras y Preferencias</h3>
          </div>
          <div className="mt-3 divide-y divide-line/70">
            <SwitchRow icon={<SquareIcon />} label="¿Quieren que los pedidos se envíen a Square?" value={a.square} onChange={(square) => set({ square })} />
            <SwitchRow icon={<PrinterIcon />} label="¿Quieren una impresora de tickets?" value={a.printer} onChange={(printer) => set({ printer })} />
          </div>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-semibold">¿Alguna nota o solicitud adicional?</span>
            <textarea value={a.notes} onChange={(e) => set({ notes: e.target.value })} rows={4} placeholder="Ej. ideas, funciones, promociones, etc." className={input} />
          </label>
        </>
      )}

      {error && <p className="mt-5 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-dark">{error}</p>}

      <div className="mt-7 flex items-center justify-between gap-3">
        <button onClick={() => go(step - 1)} className="flex items-center gap-2 rounded-full border-2 border-rose/60 bg-white px-5 py-2.5 font-hand text-xl text-rose hover:border-rose sm:px-7">
          <ArrowLeftIcon className="w-4 h-4" /> Atrás
        </button>
        <span className="hidden text-xs text-ink-soft sm:block">
          {status === "saving" ? "Guardando…" : status === "error" ? <span className="text-rose-dark">No se guardó, revisa tu conexión</span> : status === "saved" ? "Guardado ✓" : "Se guarda solo"}
        </span>
        {step < TOTAL ? (
          <button onClick={() => go(step + 1)} className="flex items-center gap-2 rounded-full bg-rose px-6 py-3 font-hand text-xl text-white shadow-md hover:bg-rose-dark sm:px-9">
            Siguiente <ArrowRightIcon className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={send} disabled={sending} className="flex items-center gap-2 rounded-full bg-rose px-6 py-3 font-hand text-xl text-white shadow-md hover:bg-rose-dark disabled:opacity-60 sm:px-8">
            {sending ? "Enviando…" : submittedAt ? "Enviar Cambios ✓" : "Enviar Respuestas ✓"}
          </button>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-ink-soft sm:hidden">{status === "saving" ? "Guardando…" : status === "saved" ? "Guardado ✓" : "Se guarda solo"}</p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8dcdc] via-[#fbeeec] to-cream px-3 py-4 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-[#fffaf8]/95 p-5 shadow-[0_10px_40px_rgba(232,80,106,0.12)] sm:p-8">{children}</div>
    </div>
  );
}

function Welcome({ started, onStart }: { started: boolean; onStart: () => void }) {
  const points = ["Es rápido y sencillo", "Se guarda automáticamente", "Puedes pausar y continuar después", "Nos ayuda a tener todo correcto"];
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8dcdc] via-[#fbeeec] to-cream px-3 py-4 sm:px-6 sm:py-10">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-white/70 bg-[#fffaf8] shadow-[0_10px_40px_rgba(232,80,106,0.12)]">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blush to-transparent" />
        <HeartDoodle className="absolute left-6 top-8 w-12 h-12 text-rose/40 -rotate-12" />
        <HeartDoodle className="absolute right-8 top-14 w-10 h-10 text-rose/30 rotate-12" />
        <div className="relative grid md:grid-cols-[0.85fr_1.15fr]">
          <div className="relative order-2 h-56 md:order-1 md:h-auto">
            <Image src="/images/gal-cup.jpg" alt="" fill sizes="(min-width: 768px) 320px, 100vw" className="object-cover md:rounded-tr-[3rem]" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-[#fffaf8] md:bg-gradient-to-l" />
          </div>
          <div className="order-1 px-6 pb-8 pt-8 text-center md:order-2 md:px-10 md:py-12">
            <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full bg-cream shadow-lg ring-4 ring-white sm:h-36 sm:w-36">
              <Image src="/images/logo-v2.png" alt="R&X Fresas con Crema" fill sizes="144px" className="object-cover" priority />
            </div>
            <h1 className="mt-5 font-hand text-5xl leading-[0.95] sm:text-6xl">Cuestionario de tu Sitio Web</h1>
            <svg viewBox="0 0 160 12" className="mx-auto mt-2 w-36 text-rose" aria-hidden>
              <path d="M2 8c25-6 50-6 75-2s55 3 81-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="mx-auto mt-4 max-w-sm text-ink-soft">Comparte la información de R&X Fresas con Crema para crear y actualizar tu sitio web.</p>
            <ul className="mx-auto mt-5 w-fit space-y-2 text-left">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-rose/60 text-[10px] font-bold text-rose">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <button onClick={onStart} className="mt-7 inline-flex items-center gap-3 rounded-full bg-rose px-9 py-3.5 font-hand text-2xl text-white shadow-lg hover:bg-rose-dark">
              {started ? "Continuar" : "Comenzar Ahora"} <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Thanks({ onReview }: { onReview: () => void }) {
  return (
    <Shell>
      <div className="py-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-3xl text-white shadow-lg">✓</span>
        <h1 className="mt-5 font-hand text-5xl">¡Gracias, R&X! ♡</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Recibimos sus respuestas. Sus redes, teléfono y ciudades ya están en la página, y nosotros nos encargamos del resto.
        </p>
        <button onClick={onReview} className="mt-7 rounded-full border-2 border-rose/60 bg-white px-7 py-2.5 font-hand text-xl text-rose hover:border-rose">
          Revisar o cambiar respuestas
        </button>
      </div>
    </Shell>
  );
}

function Section({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-rose">{icon}</span>
        <div>
          <h2 className="font-hand text-3xl leading-none sm:text-4xl">{title}</h2>
          <p className="mt-1.5 text-sm text-ink-soft">{sub}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Row({ icon, label, error, children }: { icon: React.ReactNode; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[180px_1fr] sm:items-center">
      <span className="flex items-center gap-3 text-sm font-semibold">
        <span className="grid w-6 place-items-center">{icon}</span>
        {label}
      </span>
      <span>
        {children}
        {error && <span className="mt-1 block text-sm text-rose-dark">{error}</span>}
      </span>
    </div>
  );
}

function Pill({ on, tone, small, onClick, children }: { on: boolean; tone: "green" | "rose"; small?: boolean; onClick: () => void; children: React.ReactNode }) {
  const color = tone === "green" ? (on ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "") : on ? "border-rose bg-rose-50 text-rose-dark" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border font-semibold transition-all active:scale-95 ${small ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm"} ${on ? color : "border-line bg-white text-ink-soft hover:border-rose"}`}
    >
      {children}
    </button>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${on ? "bg-rose" : "bg-[#e6d6d4]"}`}>
      <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function SwitchRow({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: Answer; onChange: (v: Answer) => void }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <span className="shrink-0 text-ink">{icon}</span>
      <span className="flex-1 text-sm">{label}</span>
      <Switch on={value === "si"} onChange={(on) => onChange(on ? "si" : "no")} label={label} />
    </div>
  );
}

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={input}>
      {TIMES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
}

function NewSpot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-2 rounded-2xl border border-line bg-white px-4 py-3 text-sm font-semibold text-rose hover:border-rose">
        <span className="text-lg leading-none">+</span> Agregar otra ubicación
      </button>
    );
  return (
    <label className="block rounded-2xl border border-line bg-white p-4">
      <span className="mb-1.5 block text-sm font-semibold">Otra ubicación</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder="Dirección o cruce de calles, días y horario. Ej: 23rd St y Macdonald, sábados 12–6" className={input} />
    </label>
  );
}

function MenuRow({ cat, value, onChange }: { cat: MenuReview; value: MenuAnswer; onChange: (patch: Partial<MenuAnswer>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button type="button" onClick={() => setOpen(!open)} className="flex min-w-0 flex-1 basis-56 items-center gap-3 text-left" aria-expanded={open}>
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-blush">{cat.image && <Image src={cat.image} alt="" fill sizes="48px" className="object-cover" />}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold leading-tight">{cat.title}</span>
            <span className="block text-sm font-semibold text-rose">{cat.price}</span>
          </span>
          <span className={`text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
            ⌄
          </span>
        </button>
        <div className="flex gap-2">
          <Pill on={value.status === "ok"} tone="green" small onClick={() => onChange({ status: value.status === "ok" ? "" : "ok" })}>
            ✓ Está bien
          </Pill>
          <Pill
            on={value.status === "edit"}
            tone="rose"
            small
            onClick={() => {
              onChange({ status: value.status === "edit" ? "" : "edit" });
              setOpen(true);
            }}
          >
            ✎ Editar
          </Pill>
        </div>
      </div>
      {open && (
        <ul className="mt-3 space-y-1.5 rounded-xl bg-cream/70 p-3 text-sm">
          {cat.items.map((i) => (
            <li key={i.name}>
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
      )}
      {value.status === "edit" && (
        <textarea value={value.fix} onChange={(e) => onChange({ fix: e.target.value })} rows={3} placeholder="¿Qué hay que cambiar? Ej: The Dubai 16oz cuesta $13, quitar el Biscoff" className={`${input} mt-3`} />
      )}
    </div>
  );
}

function PhotoBlock({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-3.5">
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

function Photos({
  kind,
  token,
  photos,
  setPhotos,
  dropzone,
}: {
  kind: PhotoKind;
  token: string;
  photos: IntakePhoto[];
  setPhotos: React.Dispatch<React.SetStateAction<IntakePhoto[]>>;
  dropzone?: boolean;
}) {
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

  const fileInput = <input ref={picker} type="file" accept="image/*" multiple={kind !== "logo"} className="hidden" onChange={(e) => upload(Array.from(e.target.files ?? []))} />;

  if (dropzone && !mine.length)
    return (
      <div>
        <button
          type="button"
          onClick={() => picker.current?.click()}
          disabled={left > 0}
          className="flex h-[118px] w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-white px-4 text-center text-xs text-ink-soft hover:border-rose"
        >
          <CloudIcon />
          {left > 0 ? "Subiendo…" : "Toca aquí para subir una foto o captura de tu menú (JPG, PNG)"}
        </button>
        {fileInput}
        {error && <p className="mt-2 text-sm text-rose-dark">{error}</p>}
      </div>
    );

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {mine.map((p) => (
          <div key={p.url} className="relative aspect-square">
            <div className="relative h-full w-full overflow-hidden rounded-xl border border-line bg-cream">
              <Image src={p.url} alt="" fill sizes="200px" className={kind === "logo" || kind === "menu" ? "object-contain" : "object-cover"} />
            </div>
            <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-xs font-bold text-white ring-2 ring-white">✓</span>
            <button
              type="button"
              onClick={() => remove(p.url)}
              aria-label="Quitar foto"
              className="absolute bottom-1.5 right-1.5 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-rose-dark shadow"
            >
              Quitar
            </button>
          </div>
        ))}
        {(kind !== "logo" || !mine.length) && (
          <button
            type="button"
            onClick={() => picker.current?.click()}
            disabled={left > 0}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-white text-sm text-ink-soft hover:border-rose hover:text-rose disabled:opacity-60"
          >
            <span className="text-3xl font-light leading-none">{left > 0 ? "…" : "+"}</span>
            {left > 0 ? `Subiendo ${left}` : "Agregar"}
          </button>
        )}
      </div>
      {fileInput}
      {error && <p className="mt-2 text-sm text-rose-dark">{error}</p>}
    </div>
  );
}

// Line icons in the mockup's style
const Svg = ({ className = "w-8 h-8", children }: { className?: string; children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    {children}
  </svg>
);
const MailIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </Svg>
);
const PhoneIcon = () => (
  <Svg className="w-5 h-5 text-rose">
    <path d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 6.5 6.5l1.5-2 4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Svg>
);
const UtensilsIcon = () => (
  <Svg>
    <path d="M7 3v8m-3-8v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2 1.5-3 4-3 7s1 4 3 4" />
  </Svg>
);
const PictureIcon = () => (
  <Svg>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <path d="m3 16 5-5 4 4 3-3 6 6" />
    <circle cx="15.5" cy="8.5" r="1.5" />
  </Svg>
);
const BookIcon = () => (
  <Svg>
    <path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5C17 4 14 4.5 12 6Zm0 0v14.5" />
  </Svg>
);
const GearIcon = () => (
  <span className="text-rose">
    <Svg>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M2 12h3m14 0h3M4.9 19.1 7 17m10-10 2.1-2.1" />
    </Svg>
  </span>
);
const SquareIcon = () => (
  <Svg className="w-5 h-5">
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
  </Svg>
);
const PrinterIcon = () => (
  <Svg className="w-5 h-5">
    <path d="M7 9V3h10v6M7 17H4v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6h-3" />
    <rect x="7" y="14" width="10" height="7" rx="1" />
  </Svg>
);
const CloudIcon = () => (
  <Svg className="w-7 h-7 text-ink">
    <path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5a4 4 0 0 1-1 8.5M12 12v8m-3-5 3-3 3 3" />
  </Svg>
);
