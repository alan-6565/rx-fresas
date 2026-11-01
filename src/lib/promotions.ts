// Promotions from Dashboard → Promotions: a thin banner across the top of
// every page and/or a big card on the home page, with optional start/end days.
// Shared by the dashboard, the API and the website.

export type Promotion = {
  id: string;
  on: boolean;
  title: string;
  message: string;
  /** Button text and where it goes; both empty for no button */
  cta: string;
  href: string;
  image: string;
  /** YYYY-MM-DD (Pacific), inclusive; empty = no limit */
  start: string;
  end: string;
  banner: boolean;
  homeCard: boolean;
};

export const LINKS = [
  { href: "/menu", label: "Menú" },
  { href: "/menu#fresas", label: "Menú · Fresas con Crema" },
  { href: "/menu#pancakes", label: "Menú · Mini Pancakes" },
  { href: "/menu#otono", label: "Menú · Para el Otoño" },
  { href: "/menu#redbulls", label: "Menú · Red Bulls" },
  { href: "/ubicaciones", label: "Ubicaciones" },
  { href: "/galeria", label: "Galería" },
  { href: "/nosotros", label: "Sobre Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export const newPromotion = (): Promotion => ({
  id: Math.random().toString(36).slice(2, 10),
  on: true,
  title: "",
  message: "",
  cta: "Ordena ahora",
  href: "/menu",
  image: "",
  start: "",
  end: "",
  banner: true,
  homeCard: false,
});

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const day = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");
// Only links inside the site, or a full https link (e.g. an Instagram post)
const link = (v: unknown) => {
  const s = text(v, 300);
  return s.startsWith("/") && !s.startsWith("//") ? s : /^https:\/\/[^\s]+$/.test(s) ? s : "";
};
const image = (v: unknown) => {
  const s = text(v, 500);
  // Site images or photos uploaded to the dashboard's storage
  return (s.startsWith("/") && !s.startsWith("//")) || s.startsWith(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`) ? s : "";
};

export function cleanPromotions(list: unknown): Promotion[] {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20).map((raw) => {
    const p = (raw ?? {}) as Record<string, unknown>;
    const href = link(p.href);
    return {
      id: text(p.id, 20) || newPromotion().id,
      on: p.on !== false,
      title: text(p.title, 60),
      message: text(p.message, 220),
      cta: href ? text(p.cta, 30) : "",
      href,
      image: image(p.image),
      start: day(p.start),
      end: day(p.end),
      banner: p.banner !== false,
      homeCard: p.homeCard === true,
    };
  });
}

export function promotionProblem(p: Promotion): string {
  if (!p.title) return "Every promotion needs a title.";
  if (!p.banner && !p.homeCard) return `"${p.title}": pick where it shows (top banner and/or home page).`;
  if (p.start && p.end && p.end < p.start) return `"${p.title}": the end date is before the start date.`;
  return "";
}

/** On, and today (YYYY-MM-DD) falls within its dates */
export const isRunning = (p: Promotion, today: string) => p.on && (!p.start || p.start <= today) && (!p.end || today <= p.end);

/** Today in Pacific time, in the browser */
export const pacificToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
