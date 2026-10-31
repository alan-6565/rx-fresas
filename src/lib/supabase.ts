import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

// Server-only client using the secret key. The browser never talks to the
// database; every read and write goes through our own API routes. Created on
// first use so a build without the keys (Vercel before env vars) doesn't crash.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error("Supabase keys are not set");
      client = createClient(url, key, { auth: { persistSession: false } });
    }
    return Reflect.get(client, prop, client);
  },
});
