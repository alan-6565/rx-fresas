import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { bad, refreshSite } from "@/lib/admin-catalog";
import { checkInfo } from "@/lib/business";
import { saveBusinessInfo } from "@/lib/business-info";
import { cleanAnswers } from "@/lib/intake-types";
import { saveIntake, validIntakeToken } from "@/lib/intake";

// The owners' questionnaire. Saving keeps a draft; sending also puts their
// contact info and each spot's city on the website.
export async function POST(req: NextRequest, { params }: RouteContext<"/api/intake/[token]">) {
  const { token } = await params;
  if (!(await validIntakeToken(token))) return bad("Este link ya no funciona.", 404);

  const body = (await req.json().catch(() => ({}))) as { answers?: unknown; submit?: boolean };
  const answers = cleanAnswers(body.answers);

  try {
    if (body.submit) {
      const { info, problems } = checkInfo(answers.contact);
      if (Object.keys(problems).length) {
        await saveIntake(answers, false);
        return NextResponse.json({ error: "Revisa los campos marcados.", problems }, { status: 400 });
      }
      await saveBusinessInfo(info);
      for (const [id, s] of Object.entries(answers.spots)) {
        // Stored like the rest: "San Pablo, CA"
        const city = s.city.trim() && (s.city.includes(",") ? s.city.trim() : `${s.city.trim()}, CA`).slice(0, 60);
        if (city) await supabaseAdmin.from("locations").update({ city, updated_at: new Date().toISOString() }).eq("id", id);
      }
      refreshSite();
    }
    await saveIntake(answers, !!body.submit);
  } catch {
    return bad("No se pudo guardar. Intenta otra vez.", 500);
  }
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
