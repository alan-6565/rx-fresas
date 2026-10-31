import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only client using the secret key. The browser never talks to the
// database; every read and write goes through our own API routes.
export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
