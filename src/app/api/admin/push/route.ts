import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type Sub = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

// Saves this device's notification sign-up (the browser's PushSubscription)
export async function POST(req: NextRequest) {
  const { subscription, label } = (await req.json().catch(() => ({}))) as { subscription?: Sub; label?: string };
  const endpoint = subscription?.endpoint;
  const { p256dh, auth } = subscription?.keys ?? {};
  if (!endpoint?.startsWith("https://") || !p256dh || !auth) return NextResponse.json({ error: "Bad subscription" }, { status: 400 });

  const { error } = await supabaseAdmin.from("push_subscriptions").upsert({ endpoint, p256dh, auth, label: label?.slice(0, 60) ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (endpoint) await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
