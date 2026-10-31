import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { getBusinessInfo } from "@/lib/business-info";
import { cleanAnswers, emptyAnswers, PHOTO_KINDS, type Intake, type IntakePhoto } from "@/lib/intake-types";

// Settings rows: "intake_token" (the secret part of the owners' link),
// "intake" (answers + when they were saved/sent) and "intake_photos".

const read = async (key: string) => {
  const { data, error } = await supabaseAdmin.from("settings").select("value").eq("key", key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
};
const write = async (key: string, value: string) => {
  const { error } = await supabaseAdmin.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
};
const json = (s: string | null) => {
  try {
    return JSON.parse(s ?? "null");
  } catch {
    return null;
  }
};

const newToken = () => Buffer.from(crypto.getRandomValues(new Uint8Array(18))).toString("base64url");

/** The link's secret, made the first time someone opens Settings */
export async function getIntakeToken(): Promise<string> {
  const saved = await read("intake_token");
  if (saved) return saved;
  const token = newToken();
  await supabaseAdmin.from("settings").upsert({ key: "intake_token", value: token }, { onConflict: "key", ignoreDuplicates: true });
  return (await read("intake_token")) ?? token;
}

/** A new link; the old one stops working */
export async function resetIntakeToken(): Promise<string> {
  const token = newToken();
  await write("intake_token", token);
  return token;
}

export async function validIntakeToken(token: string): Promise<boolean> {
  const saved = await read("intake_token");
  if (!saved || token.length !== saved.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ saved.charCodeAt(i);
  return diff === 0;
}

export async function getIntake(): Promise<Intake> {
  const [raw, rawPhotos, info] = await Promise.all([read("intake"), read("intake_photos"), getBusinessInfo()]);
  const saved = json(raw) as { answers?: unknown; savedAt?: string; submittedAt?: string } | null;
  const photos = (Array.isArray(json(rawPhotos)) ? json(rawPhotos) : []) as IntakePhoto[];
  // Before they answer, the contact fields start with what the website shows now
  const base = emptyAnswers(info);
  return {
    answers: saved?.answers ? cleanAnswers(saved.answers, base) : base,
    savedAt: saved?.savedAt ?? null,
    submittedAt: saved?.submittedAt ?? null,
    photos: photos.filter((p) => p && typeof p.url === "string" && p.kind in PHOTO_KINDS),
  };
}

export async function saveIntake(answers: Intake["answers"], submitted: boolean) {
  const prev = json(await read("intake")) as { submittedAt?: string } | null;
  const now = new Date().toISOString();
  await write("intake", JSON.stringify({ answers, savedAt: now, submittedAt: submitted ? now : (prev?.submittedAt ?? null) }));
}

export async function getIntakePhotos(): Promise<IntakePhoto[]> {
  return (await getIntake()).photos;
}

export async function saveIntakePhotos(photos: IntakePhoto[]) {
  await write("intake_photos", JSON.stringify(photos.slice(0, 80)));
}
