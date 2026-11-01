import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { cleanPromotions, type Promotion } from "@/lib/promotions";

export const getPromotions = cache(async (): Promise<Promotion[]> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await supabaseAdmin.from("settings").select("value").eq("key", "promotions").maybeSingle();
  if (error) throw error;
  try {
    return cleanPromotions(JSON.parse(data?.value ?? "[]"));
  } catch {
    return [];
  }
});

export async function savePromotions(list: Promotion[]) {
  const { error } = await supabaseAdmin.from("settings").upsert({ key: "promotions", value: JSON.stringify(list), updated_at: new Date().toISOString() });
  if (error) throw error;
}
