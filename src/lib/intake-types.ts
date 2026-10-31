import { DEFAULT_INFO, type BusinessInfo } from "@/lib/business";

// The owners' questionnaire (/bienvenida/<link>): what they answered, shared by
// the form, the API and Dashboard → Settings.

export type Answer = "" | "si" | "no" | "nose";

export type IntakeAnswers = {
  contact: Omit<BusinessInfo, "showPhone"> & { showPhone: boolean };
  spots: Record<string, { city: string; hoursOk: Answer; hoursFix: string }>;
  menuOk: Answer;
  menuFix: string;
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
  menuOk: "",
  menuFix: "",
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

/** Keeps only the known fields, as text of a sensible length */
export function cleanAnswers(raw: unknown, base: IntakeAnswers = emptyAnswers()): IntakeAnswers {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const c = (r.contact && typeof r.contact === "object" ? r.contact : {}) as Record<string, unknown>;
  const spots: IntakeAnswers["spots"] = {};
  if (r.spots && typeof r.spots === "object") {
    for (const [id, v] of Object.entries(r.spots as Record<string, Record<string, unknown>>).slice(0, 20)) {
      if (!/^[\w-]{1,60}$/.test(id) || !v || typeof v !== "object") continue;
      spots[id] = { city: str(v.city, 60), hoursOk: answer(v.hoursOk), hoursFix: str(v.hoursFix) };
    }
  }
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
    menuOk: answer(r.menuOk),
    menuFix: str(r.menuFix),
    toppingsIncluded: str(r.toppingsIncluded, 200),
    toppingExtra: str(r.toppingExtra, 200),
    moreToSell: str(r.moreToSell),
    story: str(r.story, 4000),
    square: answer(r.square),
    printer: answer(r.printer),
    notes: str(r.notes),
  };
}
