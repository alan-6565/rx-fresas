import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad } from "@/lib/admin-catalog";

// Photos from the dashboard go to the public "media" bucket. The dashboard
// shrinks them first, so they're well under Vercel's 4.5 MB request limit.
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folder = form?.get("folder") === "locations" ? "locations" : "menu";
  if (!(file instanceof File)) return bad("No photo was sent.");
  const ext = TYPES[file.type];
  if (!ext) return bad("Use a JPG, PNG or WebP photo.");
  if (file.size > MAX_BYTES) return bad("That photo is too big (4 MB max).");

  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage.from("media").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) return bad("Couldn't upload the photo", 500);
  const { data } = supabaseAdmin.storage.from("media").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
