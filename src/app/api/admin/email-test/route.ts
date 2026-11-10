import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email";

/** Settings → Email: sends one test email and returns Resend's answer */
export async function POST() {
  return NextResponse.json(await sendTestEmail());
}
