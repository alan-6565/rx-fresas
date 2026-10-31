// Creates R&X's connected Stripe account (once) and prints a link for the
// owner to finish Stripe's sign-up. Run again any time for a fresh link or to
// check whether they can take payments yet.
//
//   node --env-file=.env.local scripts/connect-rx.mjs [return-url]
//   node --env-file=.env.local scripts/connect-rx.mjs --status

const STRIPE_V2_VERSION = "2026-09-30.preview";
const { STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!STRIPE_SECRET_KEY || !NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing keys in .env.local");

async function stripeV2(method, path, body) {
  const res = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Stripe-Version": STRIPE_V2_VERSION,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Stripe ${path} ${res.status}: ${JSON.stringify(data.error ?? data)}`);
  return data;
}

async function db(method, query, body) {
  const res = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${query}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${query} ${res.status}: ${await res.text()}`);
  return res.status === 204 || res.headers.get("content-length") === "0" ? null : res.json().catch(() => null);
}

const rows = await db("GET", "settings?key=eq.stripe_account_id&select=value");
let accountId = rows?.[0]?.value;

if (process.argv[2] === "--status") {
  if (!accountId) {
    console.log("No R&X account yet. Run without --status to create one.");
  } else {
    const a = await stripeV2("GET", `/v2/core/accounts/${accountId}?include[0]=configuration.merchant&include[1]=requirements`);
    const status = a.configuration?.merchant?.capabilities?.card_payments?.status;
    const due = (a.requirements?.entries ?? []).filter((r) => r.awaiting_action_from === "user").length;
    console.log(`Account ${accountId}: card payments ${status ?? "not requested"}, ${due} item(s) waiting on the owner`);
  }
  process.exit(0);
}

if (!accountId) {
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
        mcc: "5812", // eating places and restaurants
        capabilities: { card_payments: { requested: true } },
        statement_descriptor: { descriptor: "RX FRESAS CON CREMA" },
      },
    },
  });
  accountId = account.id;
  await db("POST", "settings", { key: "stripe_account_id", value: accountId, updated_at: new Date().toISOString() });
  console.log(`Created R&X account ${accountId}`);
}

const returnUrl = process.argv[2] ?? "http://localhost:3011/";
const link = await stripeV2("POST", "/v2/core/account_links", {
  account: accountId,
  use_case: { type: "account_onboarding", account_onboarding: { return_url: returnUrl, refresh_url: returnUrl } },
});
console.log(`\nSign-up link for R&X (expires soon, run again for a new one):\n${link.url}`);
