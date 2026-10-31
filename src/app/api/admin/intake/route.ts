import { NextResponse } from "next/server";
import { bad } from "@/lib/admin-catalog";
import { resetIntakeToken } from "@/lib/intake";

/** A new questionnaire link; the old one stops working */
export async function POST() {
  try {
    return NextResponse.json({ token: await resetIntakeToken() });
  } catch {
    return bad("Couldn't make a new link", 500);
  }
}
