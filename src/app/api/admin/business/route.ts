import { NextRequest, NextResponse } from "next/server";
import { bad, refreshSite } from "@/lib/admin-catalog";
import { checkInfo } from "@/lib/business";
import { saveBusinessInfo } from "@/lib/business-info";

/** Contact info and social links from Dashboard → Settings */
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { info, problems } = checkInfo(body);
  const first = Object.values(problems)[0];
  if (first) return bad(first);
  try {
    await saveBusinessInfo(info);
  } catch {
    return bad("Couldn't save", 500);
  }
  refreshSite();
  return NextResponse.json({ info });
}
