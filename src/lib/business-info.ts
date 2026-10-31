import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { DEFAULT_INFO, parseInfo, type BusinessInfo } from "@/lib/business";

export const getBusinessInfo = cache(async (): Promise<BusinessInfo> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return DEFAULT_INFO;
  const { data, error } = await supabaseAdmin.from("settings").select("value").eq("key", "business").maybeSingle();
  if (error) throw error;
  return parseInfo(data?.value);
});

export async function saveBusinessInfo(info: BusinessInfo) {
  const { error } = await supabaseAdmin.from("settings").upsert({ key: "business", value: JSON.stringify(info), updated_at: new Date().toISOString() });
  if (error) throw error;
}
