import "server-only";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase";

let ready = false;
function setup() {
  if (ready) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails("https://rx-fresas.vercel.app", pub, priv);
  ready = true;
  return true;
}

/** Sends a notification to every device that turned them on; drops dead ones */
export async function notifyStaff(payload: { title: string; body: string; url: string; tag?: string }) {
  if (!setup()) return;
  const { data: subs } = await supabaseAdmin.from("push_subscriptions").select("endpoint, p256dh, auth");
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { urgency: "high", TTL: 60 * 60 });
      } catch (e) {
        // 404/410: the device unsubscribed or the app was removed
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        else console.error("[push] send failed", code);
      }
    }),
  );
}
