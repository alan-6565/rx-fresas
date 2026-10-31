import { NextRequest, NextResponse } from "next/server";
import { bad } from "@/lib/admin-catalog";
import { UploadError, uploadMedia } from "@/lib/media";
import { PHOTO_KINDS, type PhotoKind } from "@/lib/intake-types";
import { getIntakePhotos, saveIntakePhotos, validIntakeToken } from "@/lib/intake";

// Photos the owners add to their questionnaire. They wait in Dashboard →
// Settings until someone puts them on the website.

export async function POST(req: NextRequest, { params }: RouteContext<"/api/intake/[token]/upload">) {
  const { token } = await params;
  if (!(await validIntakeToken(token))) return bad("Este link ya no funciona.", 404);
  const form = await req.formData().catch(() => null);
  const kind = String(form?.get("kind")) as PhotoKind;
  if (!(kind in PHOTO_KINDS)) return bad("Tipo de foto desconocido.");

  try {
    const photos = await getIntakePhotos();
    if (photos.length >= 80) return bad("Ya hay muchas fotos (80 máximo).");
    const url = await uploadMedia(form?.get("file"), "intake");
    const photo = { url, kind, at: new Date().toISOString() };
    await saveIntakePhotos([...photos, photo]);
    return NextResponse.json({ photo });
  } catch (e) {
    return e instanceof UploadError ? bad("Usa una foto JPG, PNG o WebP de menos de 4 MB.") : bad("No se pudo subir la foto. Intenta otra vez.", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext<"/api/intake/[token]/upload">) {
  const { token } = await params;
  if (!(await validIntakeToken(token))) return bad("Este link ya no funciona.", 404);
  const { url } = (await req.json().catch(() => ({}))) as { url?: string };
  try {
    await saveIntakePhotos((await getIntakePhotos()).filter((p) => p.url !== url));
  } catch {
    return bad("No se pudo quitar la foto.", 500);
  }
  return NextResponse.json({ ok: true });
}
