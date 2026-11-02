import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { cleanDelivery, DEFAULT_DELIVERY, type DeliverySettings } from "@/lib/delivery";

export const getDelivery = cache(async (): Promise<DeliverySettings> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return DEFAULT_DELIVERY;
  const { data } = await supabaseAdmin.from("settings").select("value").eq("key", "delivery").maybeSingle();
  if (!data) return DEFAULT_DELIVERY;
  try {
    return cleanDelivery(JSON.parse(data.value));
  } catch {
    return DEFAULT_DELIVERY;
  }
});

export async function saveDelivery(s: DeliverySettings) {
  const { error } = await supabaseAdmin.from("settings").upsert({ key: "delivery", value: JSON.stringify(s), updated_at: new Date().toISOString() });
  if (error) throw error;
}
