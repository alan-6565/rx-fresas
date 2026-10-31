import { DEFAULT_INFO, type BusinessInfo } from "@/lib/business";
import { formatTime, toMinutes } from "@/lib/schedule";

// The owners' questionnaire (/bienvenida/<link>): what they answered, shared by
// the form, the API and Dashboard → Settings.

export type Answer = "" | "si" | "no" | "nose";

export type SpotAnswer = { city: string; hoursOk: Answer; days: string; start: string; end: string; hoursFix: string };
/** Per menu category: "ok" = está bien, "edit" = needs the change in `fix` */
export type MenuAnswer = { status: "" | "ok" | "edit"; fix: string };

export type IntakeAnswers = {
  contact: BusinessInfo;
  spots: Record<string, SpotAnswer>;
  newSpot: string;
  menu: Record<string, MenuAnswer>;
  toppingsIncluded: string;
  toppingExtra: string;
  moreToSell: string;
  story: string;
  square: Answer;
  printer: Answer;
  notes: string;
};

export const PHOTO_KINDS = {
  logo: "Logo",
  menu: "Menu",
  truck: "Truck",
  food: "Food & drinks",
  team: "Owners & team",
} as const;
export type PhotoKind = keyof typeof PHOTO_KINDS;
export type IntakePhoto = { url: string; kind: PhotoKind; at: string };

export type Intake = { answers: IntakeAnswers; savedAt: string | null; submittedAt: string | null; photos: IntakePhoto[] };

export const emptyAnswers = (contact: BusinessInfo = DEFAULT_INFO): IntakeAnswers => ({
  contact: { ...contact },
  spots: {},
  newSpot: "",
  menu: {},
  toppingsIncluded: "",
  toppingExtra: "",
  moreToSell: "",
  story: "",
  square: "",
  printer: "",
  notes: "",
});

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.slice(0, max) : "");
const answer = (v: unknown): Answer => (v === "si" || v === "no" || v === "nose" ? v : "");
const time = (v: unknown) => (typeof v === "string" && /^\d{2}:\d{2}$/.test(v) ? v : "");
const entries = (v: unknown) => (v && typeof v === "object" ? Object.entries(v as Record<string, Record<string, unknown>>).slice(0, 30) : []).filter(([id, x]) => /^[\w-]{1,60}$/.test(id) && x && typeof x === "object");

/** Keeps only the known fields, as text of a sensible length */
export function cleanAnswers(raw: unknown, base: IntakeAnswers = emptyAnswers()): IntakeAnswers {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const c = (r.contact && typeof r.contact === "object" ? r.contact : {}) as Record<string, unknown>;
  const spots: IntakeAnswers["spots"] = {};
  for (const [id, v] of entries(r.spots))
    spots[id] = { city: str(v.city, 60), hoursOk: answer(v.hoursOk), days: str(v.days, 60), start: time(v.start), end: time(v.end), hoursFix: str(v.hoursFix) };
  const menu: IntakeAnswers["menu"] = {};
  for (const [id, v] of entries(r.menu)) menu[id] = { status: v.status === "ok" || v.status === "edit" ? v.status : "", fix: str(v.fix) };
  return {
    contact: {
      instagram: "instagram" in c ? str(c.instagram, 200) : base.contact.instagram,
      tiktok: "tiktok" in c ? str(c.tiktok, 200) : base.contact.tiktok,
      facebook: "facebook" in c ? str(c.facebook, 200) : base.contact.facebook,
      phone: "phone" in c ? str(c.phone, 40) : base.contact.phone,
      email: "email" in c ? str(c.email, 120) : base.contact.email,
      showPhone: "showPhone" in c ? c.showPhone !== false : base.contact.showPhone,
    },
    spots,
    newSpot: str(r.newSpot),
    menu,
    toppingsIncluded: str(r.toppingsIncluded, 200),
    toppingExtra: str(r.toppingExtra, 200),
    moreToSell: str(r.moreToSell),
    story: str(r.story, 4000),
    square: answer(r.square),
    printer: answer(r.printer),
    notes: str(r.notes),
  };
}

export const DAY_CHOICES = ["Todos los días", "Lunes a viernes", "Lunes a sábado", "Miércoles a domingo", "Fines de semana"];

/** "Todos los días · 6:00 p.m. – 10:30 p.m." for a spot whose hours need fixing */
export function newHours(s: SpotAnswer) {
  const times = s.start && s.end ? `${formatTime(toMinutes(s.start))} – ${formatTime(toMinutes(s.end))}` : "";
  return [s.days, times].filter(Boolean).join(" · ");
}
