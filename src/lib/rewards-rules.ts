// Puntos R&X: every paid order earns points under the customer's phone number,
// and enough points buys one free drink. Shared by the checkout, the server and
// the dashboard so the numbers always match.

export const POINTS_PER_ORDER = 5;
export const POINTS_FOR_DRINK = 100;
/** Menu sections whose items count as a drink */
export const DRINK_CATEGORIES = ["cafes", "otono", "redbulls"];

export const isDrink = (item: { category: string }) => DRINK_CATEGORIES.includes(item.category);

/** The free drink covers the menu price of the priciest drink in the order; sizes and extras are still paid */
export function freeDrinkCents(lines: { item: { category: string; price: number } }[]): number {
  return Math.max(0, ...lines.filter((l) => isDrink(l.item)).map((l) => Math.round(l.item.price * 100)));
}

/** "j***@gmail.com" */
export const maskEmail = (email: string) => email.replace(/^(.)[^@]*(@.*)$/, "$1***$2");
