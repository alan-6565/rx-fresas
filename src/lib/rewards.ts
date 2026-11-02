import "server-only";
import { createHash, randomInt } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { POINTS_PER_ORDER } from "@/lib/rewards-rules";

// Points live on the orders themselves: every paid order earns points, and an
// order that used a free drink spends them. A refund undoes both. To spend
// points the customer types a code we email to the address on their past
// orders, so knowing someone's phone number isn't enough.

const CODE_MINUTES = 15;
const MAX_TRIES = 5;
/** An unpaid checkout holds its points this long (Stripe's checkout lasts 30 min) */
const HOLD_MINUTES = 35;

const hash = (phone: string, code: string) => createHash("sha256").update(`${phone}|${code}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex");

/** Balance for a phone number, saved as "(510) 555-1234" */
export async function pointsFor(phone: string): Promise<{ points: number; earned: number; email: string | null }> {
  const since = Date.now() - HOLD_MINUTES * 60_000;
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("payment_status, points_redeemed, customer_email, created_at")
    .eq("customer_phone", phone)
    .in("payment_status", ["paid", "pending"])
    .order("created_at", { ascending: false });
  if (error) throw error;

  let earned = 0;
  let spent = 0;
  let email: string | null = null;
  for (const o of data ?? []) {
    if (o.payment_status === "paid") {
      earned += POINTS_PER_ORDER;
      spent += o.points_redeemed;
      email ??= o.customer_email;
    } else if (Date.parse(o.created_at) > since) spent += o.points_redeemed;
  }
  return { points: Math.max(0, earned - spent), earned, email };
}

/** Emails a 6-digit code; at most 3 every 15 minutes per phone */
export async function createRewardCode(phone: string, email: string): Promise<{ code: string } | { error: string }> {
  const since = new Date(Date.now() - CODE_MINUTES * 60_000).toISOString();
  const { count } = await supabaseAdmin.from("reward_codes").select("id", { count: "exact", head: true }).eq("phone", phone).gt("created_at", since);
  if ((count ?? 0) >= 3) return { error: "Ya te mandamos varios códigos. Revisa tu correo o espera unos minutos." };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const { error } = await supabaseAdmin.from("reward_codes").insert({
    phone,
    email,
    code_hash: hash(phone, code),
    expires_at: new Date(Date.now() + CODE_MINUTES * 60_000).toISOString(),
  });
  if (error) return { error: "No pudimos crear tu código. Intenta otra vez." };
  return { code };
}

/**
 * Checks a code for this phone and (with `consume`) uses it up. Returns the
 * code's row id, or an error in Spanish. Wrong guesses count against the
 * newest code.
 */
export async function checkRewardCode(phone: string, code: string, consume: boolean): Promise<{ id: string } | { error: string }> {
  const { data: row } = await supabaseAdmin
    .from("reward_codes")
    .select("id, code_hash, expires_at, attempts, used_at")
    .eq("phone", phone)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row || Date.parse(row.expires_at) < Date.now() || row.attempts >= MAX_TRIES) return { error: "Tu código venció. Pide uno nuevo." };
  if (row.code_hash !== hash(phone, code.replace(/\D/g, ""))) {
    await supabaseAdmin.from("reward_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
    return { error: "Ese código no es correcto." };
  }
  if (!consume) return { id: row.id };
  const { data: used } = await supabaseAdmin.from("reward_codes").update({ used_at: new Date().toISOString() }).eq("id", row.id).is("used_at", null).select("id");
  return used?.length ? { id: row.id } : { error: "Tu código ya se usó. Pide uno nuevo." };
}

export const linkRewardCode = (id: string, orderId: string) => supabaseAdmin.from("reward_codes").update({ order_id: orderId }).eq("id", id);
