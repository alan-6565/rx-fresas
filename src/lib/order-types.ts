// Shared by the staff dashboard's server routes and its client pages.
export type StaffOrder = {
  id: string;
  order_number: number;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  location: string;
  pickup_date: string;
  pickup_time: string;
  payment_status: "paid" | "refunded";
  fulfillment_status: "new" | "preparing" | "ready" | "out_for_delivery" | "picked_up" | "delivered" | "cancelled";
  item_count: number;
  subtotal_cents: number;
  platform_fee_cents: number;
  card_fee_cents: number;
  total_cents: number;
  fulfillment_type: "pickup" | "delivery";
  delivery_address: string | null;
  delivery_instructions: string | null;
  delivery_photo_url: string | null;
  delivery_fee_cents: number;
  discount_cents: number;
  points_redeemed: number;
  order_items: { menu_item_id: string; name: string; quantity: number; price_cents: number; options: { group: string; name: string; price_cents: number }[] | null }[];
};

export const ORDER_COLUMNS =
  "id, order_number, created_at, customer_name, customer_phone, notes, location, pickup_date, pickup_time, payment_status, fulfillment_status, item_count, subtotal_cents, platform_fee_cents, card_fee_cents, total_cents, fulfillment_type, delivery_address, delivery_instructions, delivery_photo_url, delivery_fee_cents, discount_cents, points_redeemed, order_items(menu_item_id, name, quantity, price_cents, options)";

export const RANGES = { today: "Today", tomorrow: "Tomorrow", yesterday: "Yesterday", week: "Last 7 days" } as const;
export type Range = keyof typeof RANGES;
