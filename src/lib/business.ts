// Contact info and social links shown on the website. The owners fill these in
// through their questionnaire link, and staff can change them in Dashboard →
// Settings. Stored in the settings table under "business" (JSON).

export type BusinessInfo = {
  instagram: string; // handle, without the @
  tiktok: string;
  facebook: string; // full page link, or empty
  phone: string; // "(510) 555-1234", or empty
  email: string;
  showPhone: boolean;
};

export const DEFAULT_INFO: BusinessInfo = {
  instagram: "rx_fresasconcrema",
  tiktok: "rx_fresasconcrema",
  facebook: "",
  phone: "",
  email: "",
  showPhone: true,
};

/** "@rx", "instagram.com/rx/?hl=es" or "https://www.tiktok.com/@rx" → "rx" */
export function cleanHandle(input: string): string {
  const s = input
    .trim()
    .replace(/^(https?:\/\/)?(www\.|m\.)?(instagram\.com|tiktok\.com)\//i, "")
    .replace(/^@/, "")
    .split(/[/?#\s]/)[0];
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : "";
}

/** A 10-digit US number in the usual format, or "" if it isn't one */
export function cleanPhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : "";
}

export const cleanEmail = (input: string) => {
  const s = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(s) && s.length <= 120 ? s : "";
};

/** A facebook.com page link, or a page name turned into one */
export function cleanFacebook(input: string): string {
  const s = input.trim();
  if (!s) return "";
  const m = s.match(/^(https?:\/\/)?(www\.|m\.|web\.)?(facebook\.com|fb\.com)\/(.+)$/i);
  if (m) return `https://www.facebook.com/${m[4].split("#")[0]}`.slice(0, 200);
  return /^[A-Za-z0-9.\-]{2,80}$/.test(s) ? `https://www.facebook.com/${s}` : "";
}

/** Checks every field; problems come back in Spanish for the questionnaire */
export function checkInfo(raw: Partial<Record<keyof BusinessInfo, unknown>>): { info: BusinessInfo; problems: Partial<Record<keyof BusinessInfo, string>> } {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const problems: Partial<Record<keyof BusinessInfo, string>> = {};
  const info = { ...DEFAULT_INFO, showPhone: raw.showPhone !== false };

  const field = <K extends "instagram" | "tiktok" | "facebook" | "phone" | "email">(key: K, clean: (s: string) => string, msg: string) => {
    const given = str(raw[key]).trim();
    const value = clean(given);
    if (given && !value) problems[key] = msg;
    info[key] = value;
  };
  field("instagram", cleanHandle, "Escribe el usuario de Instagram, por ejemplo @rx_fresasconcrema.");
  field("tiktok", cleanHandle, "Escribe el usuario de TikTok, por ejemplo @rx_fresasconcrema.");
  field("facebook", cleanFacebook, "Pega el link de su página de Facebook.");
  field("phone", cleanPhone, "El teléfono debe tener 10 números.");
  field("email", cleanEmail, "Ese correo no se ve bien.");
  return { info, problems };
}

/** What the website shows, with fallbacks for anything left empty */
export function socialLinks(info: BusinessInfo) {
  const ig = info.instagram || DEFAULT_INFO.instagram;
  return {
    handle: `@${ig}`,
    instagram: `https://www.instagram.com/${ig}`,
    tiktok: info.tiktok ? `https://www.tiktok.com/@${info.tiktok}` : "",
    facebook: info.facebook,
    phone: info.showPhone ? info.phone : "",
    phoneHref: info.showPhone && info.phone ? `tel:+1${info.phone.replace(/\D/g, "")}` : "",
    email: info.email,
  };
}
export type SocialLinks = ReturnType<typeof socialLinks>;

export function parseInfo(json: string | null | undefined): BusinessInfo {
  try {
    const v = JSON.parse(json ?? "null");
    if (v && typeof v === "object") return { ...DEFAULT_INFO, ...checkInfo(v).info };
  } catch {}
  return DEFAULT_INFO;
}
