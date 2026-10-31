import { NextRequest, NextResponse } from "next/server";
import { bad } from "@/lib/admin-catalog";
import { UploadError, uploadMedia } from "@/lib/media";

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const folder = ["locations", "site"].includes(String(form?.get("folder"))) ? String(form?.get("folder")) : "menu";
  try {
    return NextResponse.json({ url: await uploadMedia(form?.get("file"), folder) });
  } catch (e) {
    return e instanceof UploadError ? bad(e.message) : bad("Couldn't upload the photo", 500);
  }
}
