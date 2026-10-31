import "server-only";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

let client: Stripe | undefined;

// Created on first use so a build without STRIPE_SECRET_KEY doesn't crash.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!client) {
      if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
      client = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return Reflect.get(client, prop, client);
  },
});

// Connected accounts use Stripe's Accounts v2 API, which the SDK doesn't cover,
// so it's called directly (same as Kuppio's stripe-connect function).
const STRIPE_V2_VERSION = "2026-09-30.preview";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function stripeV2<T = any>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Stripe-Version": STRIPE_V2_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${path} ${res.status}: ${JSON.stringify(data.error ?? data)}`);
  return data as T;
}

/** Test and live keys each have their own R&X account, so switching keys never mixes them */
export const accountSettingKey = () => (process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "stripe_account_id_live" : "stripe_account_id");

/** R&X's connected Stripe account, saved by scripts/connect-rx.mjs */
export async function connectedAccountId(): Promise<string | null> {
  const { data } = await supabaseAdmin.from("settings").select("value").eq("key", accountSettingKey()).maybeSingle();
  return data?.value ?? null;
}
