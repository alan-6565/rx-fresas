import type { Item } from "@/lib/data";

// Everything is in cents. The customer pays the platform fee and the card
// processing on top of menu prices, so R&X keeps the full menu price. No sales
// tax is added; R&X handles tax the same way they do at the truck.

// Platform fee: $1 for every item in the order, no cap.
export const PLATFORM_FEE_PER_ITEM = 100;

// Stripe's standard US card pricing.
const STRIPE_PERCENT = 0.029;
const STRIPE_FIXED = 30;

export type Line = { id: string; qty: number };

export type Quote = {
  items: number;
  subtotal: number;
  platformFee: number;
  cardFee: number;
  total: number;
  /** What lands in R&X's Stripe balance after Stripe and the platform fee */
  payout: number;
};

/** Stripe's fee on a charge, rounded to the cent like Stripe does */
export function stripeFee(amount: number) {
  return Math.round(amount * STRIPE_PERCENT) + STRIPE_FIXED;
}

/**
 * Prices an order from menu ids only, so the browser can't change a price.
 * Unknown (or hidden) ids and bad quantities are rejected rather than skipped.
 */
export function quote(lines: Line[], menu: Item[]): Quote {
  let items = 0;
  let subtotal = 0;
  for (const { id, qty } of lines) {
    const item = menu.find((m) => m.id === id);
    if (!item) throw new Error(`Unknown menu item: ${id}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new Error(`Bad quantity for ${id}`);
    items += qty;
    subtotal += Math.round(item.price * 100) * qty;
  }

  const platformFee = items * PLATFORM_FEE_PER_ITEM;
  const base = subtotal + platformFee;

  // Smallest total whose Stripe fee is fully covered by the card fee
  let total = items === 0 ? 0 : Math.ceil((base + STRIPE_FIXED) / (1 - STRIPE_PERCENT));
  while (total > 0 && total - stripeFee(total) < base) total++;

  const cardFee = total - base;
  return { items, subtotal, platformFee, cardFee, total, payout: total - stripeFee(total) - platformFee };
}
