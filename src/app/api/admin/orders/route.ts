import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { pacificDate } from "@/lib/time";
import { ORDER_COLUMNS, RANGES, type Range } from "@/lib/order-types";

// Paid orders only: unpaid or abandoned checkouts never reach the staff screen.
// Filtered by pickup date, since that's the day staff make them.
export async function GET(req: NextRequest) {
  const range = (req.nextUrl.searchParams.get("range") ?? "today") as Range;
  if (!(range in RANGES)) return NextResponse.json({ error: "Bad range" }, { status: 400 });

  let query = supabaseAdmin.from("orders").select(ORDER_COLUMNS).in("payment_status", ["paid", "refunded"]);
  if (range === "today") query = query.eq("pickup_date", pacificDate(0));
  if (range === "tomorrow") query = query.eq("pickup_date", pacificDate(1));
  if (range === "yesterday") query = query.eq("pickup_date", pacificDate(-1));
  if (range === "week") query = query.gte("pickup_date", pacificDate(-6)).lte("pickup_date", pacificDate(0));

  const { data, error } = await query.order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}
