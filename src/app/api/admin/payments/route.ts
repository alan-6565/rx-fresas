import { NextRequest, NextResponse } from "next/server";
import { dashboardLink, onboardingLink, paymentsStatus } from "@/lib/payments";

export async function GET() {
  return NextResponse.json(await paymentsStatus());
}

/** { action: "onboard" } → Stripe sign-up link, { action: "dashboard" } → their Stripe dashboard */
export async function POST(req: NextRequest) {
  const { action } = (await req.json().catch(() => ({}))) as { action?: string };
  try {
    if (action === "dashboard") return NextResponse.json({ url: await dashboardLink() });
    if (action === "onboard") return NextResponse.json({ url: await onboardingLink(`${req.nextUrl.origin}/admin/settings?stripe=back`) });
  } catch {
    return NextResponse.json({ error: "Stripe didn't answer. Try again in a minute." }, { status: 502 });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
