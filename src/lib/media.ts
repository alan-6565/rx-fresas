import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

// Photos go to the public "media" bucket. Pages shrink them first, so they're
// well under Vercel's 4.5 MB request limit.
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 4 * 1024 * 1024;

export class UploadError extends Error {}

export async function uploadMedia(file: FormDataEntryValue | null | undefined, folder: string): Promise<string> {
  if (!(file instanceof File)) throw new UploadError("No photo was sent.");
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Use a JPG, PNG or WebP photo.");
  if (file.size > MAX_BYTES) throw new UploadError("That photo is too big (4 MB max).");

  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage.from("media").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw new Error("Couldn't upload the photo");
  return supabaseAdmin.storage.from("media").getPublicUrl(path).data.publicUrl;
}
