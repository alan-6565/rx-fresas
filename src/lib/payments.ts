import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { accountSettingKey, stripe, stripeV2 } from "@/lib/stripe";

// R&X's own Stripe account, set up from Dashboard → Settings → Payments
// (scripts/connect-rx.mjs does the same from the terminal).

export type PaymentsStatus = {
  live: boolean;
  accountId: string | null;
  /** "active" once they can take cards */
  cardPayments: string | null;
  /** Things Stripe still needs from the owner */
  due: number;
  error?: string;
};

const isLive = () => !!process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_");

async function savedAccount(): Promise<string | null> {
  const { data } = await supabaseAdmin.from("settings").select("value").eq("key", accountSettingKey()).maybeSingle();
  return data?.value ?? null;
}

export async function paymentsStatus(): Promise<PaymentsStatus> {
  const base = { live: isLive(), accountId: null, cardPayments: null, due: 0 };
  if (!process.env.STRIPE_SECRET_KEY) return { ...base, error: "Stripe isn't connected to the website yet." };
  try {
    const accountId = await savedAccount();
    if (!accountId) return base;
    const a = await stripeV2("GET", `/v2/core/accounts/${accountId}?include[0]=configuration.merchant&include[1]=requirements`);
    return {
      ...base,
      accountId,
      cardPayments: a.configuration?.merchant?.capabilities?.card_payments?.status ?? null,
      due: (a.requirements?.entries ?? []).filter((r: { awaiting_action_from?: string }) => r.awaiting_action_from === "user").length,
    };
  } catch {
    return { ...base, error: "Couldn't reach Stripe. Try again in a minute." };
  }
}

/** Creates R&X's account the first time */
async function ensureAccount(): Promise<string> {
  const existing = await savedAccount();
  if (existing) return existing;
  const account = await stripeV2("POST", "/v2/core/accounts", {
    display_name: "R&X Fresas con Crema",
    identity: { country: "US" },
    dashboard: "express",
    defaults: {
      // Stripe takes its card fee from R&X's charges (the customer's card fee
      // line covers it) and covers losses R&X can't, not the platform.
      responsibilities: { fees_collector: "stripe", losses_collector: "stripe" },
      profile: {
        doing_business_as: "R&X Fresas con Crema",
        product_description: "Food truck in Richmond, CA: coffee, fresas con crema and mini pancakes ordered ahead online and picked up at the truck.",
      },
    },
    configuration: {
      merchant: {
        mcc: "5812",
        capabilities: { card_payments: { requested: true } },
        statement_descriptor: { descriptor: "RX FRESAS CON CREMA" },
      },
    },
  });
  const { error } = await supabaseAdmin.from("settings").upsert({ key: accountSettingKey(), value: account.id, updated_at: new Date().toISOString() });
  if (error) throw error;
  return account.id;
}

/** A fresh one-time link to Stripe's sign-up (they expire after a few minutes) */
export async function onboardingLink(returnUrl: string): Promise<string> {
  const account = await ensureAccount();
  const link = await stripeV2("POST", "/v2/core/account_links", {
    account,
    use_case: { type: "account_onboarding", account_onboarding: { return_url: returnUrl, refresh_url: returnUrl } },
  });
  return link.url;
}

/** Sign-in link to their Stripe Express dashboard (payouts, bank, tax forms) */
export async function dashboardLink(): Promise<string> {
  const account = await savedAccount();
  if (!account) throw new Error("No Stripe account yet");
  const link = await stripe.accounts.createLoginLink(account);
  return link.url;
}
