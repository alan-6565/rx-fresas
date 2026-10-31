import { items as menu } from "@/lib/data";

// Everything is in cents. The customer pays tax, the platform fee and the card
// processing, so R&X keeps the full menu price plus the tax they owe the state.

// Richmond, CA combined rate (6% state + 0.25% county + 1% city + 2.5% district).
// Confirm each truck location with CDTFA's address lookup before going live.
export const TAX_RATE = 0.0975;

// Platform fee: $1 for every item in the order, no cap.
export const PLATFORM_FEE_PER_ITEM = 100;

// Stripe's standard US card pricing.
const STRIPE_PERCENT = 0.029;
const STRIPE_FIXED = 30;

export type Line = { id: string; qty: number };

export type Quote = {
  items: number;
  subtotal: number;
  tax: number;
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
 * Unknown ids and bad quantities are rejected rather than skipped.
 */
export function quote(lines: Line[]): Quote {
  let items = 0;
  let subtotal = 0;
  for (const { id, qty } of lines) {
    const item = menu.find((m) => m.id === id);
    if (!item) throw new Error(`Unknown menu item: ${id}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new Error(`Bad quantity for ${id}`);
    items += qty;
    subtotal += Math.round(item.price * 100) * qty;
  }

  const tax = Math.round(subtotal * TAX_RATE);
  const platformFee = items * PLATFORM_FEE_PER_ITEM;
  const base = subtotal + tax + platformFee;

  // Smallest total whose Stripe fee is fully covered by the card fee
  let total = items === 0 ? 0 : Math.ceil((base + STRIPE_FIXED) / (1 - STRIPE_PERCENT));
  while (total > 0 && total - stripeFee(total) < base) total++;

  const cardFee = total - base;
  return { items, subtotal, tax, platformFee, cardFee, total, payout: total - stripeFee(total) - platformFee };
}
