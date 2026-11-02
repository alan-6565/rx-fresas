import { NextRequest, NextResponse } from "next/server";
import { cleanPhone } from "@/lib/business";
import { emailReady, sendRewardCode } from "@/lib/email";
import { checkRewardCode, createRewardCode, pointsFor } from "@/lib/rewards";
import { maskEmail, POINTS_FOR_DRINK } from "@/lib/rewards-rules";

// Puntos at checkout: "check" shows the balance for a phone, "send" emails a
// code to the address on their past orders, "verify" checks the code before
// they pay (checkout uses it up).

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { action?: string; phone?: string; code?: string };
  const phone = cleanPhone(body.phone ?? "");
  if (!phone) return bad("Escribe un teléfono de 10 números.");

  let balance;
  try {
    balance = await pointsFor(phone);
  } catch {
    return bad("No pudimos revisar tus puntos. Intenta otra vez.", 500);
  }
  const { points, email } = balance;

  if (body.action === "check") return NextResponse.json({ points, canRedeem: points >= POINTS_FOR_DRINK && !!email && emailReady() });

  if (points < POINTS_FOR_DRINK) return bad(`Necesitas ${POINTS_FOR_DRINK} puntos para una bebida gratis.`);
  if (!email || !emailReady()) return bad("No podemos mandarte el código ahora. Pregunta en el truck. ♡");

  if (body.action === "send") {
    const made = await createRewardCode(phone, email);
    if ("error" in made) return bad(made.error, 429);
    try {
      await sendRewardCode(email, made.code);
    } catch {
      return bad("No pudimos mandar el correo. Intenta otra vez.", 502);
    }
    return NextResponse.json({ sent: true, emailHint: maskEmail(email) });
  }

  if (body.action === "verify") {
    const ok = await checkRewardCode(phone, body.code ?? "", false);
    return "error" in ok ? bad(ok.error) : NextResponse.json({ ok: true });
  }

  return bad("Acción desconocida.");
}
