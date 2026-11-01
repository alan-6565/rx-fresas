import { NextRequest, NextResponse } from "next/server";
import { bad, refreshSite } from "@/lib/admin-catalog";
import { cleanPromotions, promotionProblem } from "@/lib/promotions";
import { savePromotions } from "@/lib/promotions-store";

/** Saves the whole list from Dashboard → Promotions */
export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { promotions?: unknown };
  const list = cleanPromotions(body.promotions);
  const problem = list.map(promotionProblem).find(Boolean);
  if (problem) return bad(problem);
  try {
    await savePromotions(list);
  } catch {
    return bad("Couldn't save", 500);
  }
  refreshSite();
  return NextResponse.json({ promotions: list });
}
