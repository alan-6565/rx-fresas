// Puntos R&X: every paid order earns points under the customer's phone number,
// and enough points buys one free drink. Shared by the checkout, the server and
// the dashboard so the numbers always match.

export const POINTS_PER_ORDER = 5;
export const POINTS_FOR_DRINK = 100;
/** Menu sections whose items count as a drink */
export const DRINK_CATEGORIES = ["cafes", "otono", "redbulls"];

/** Off one drink or fresas in the first paid order for a phone and email, applied at checkout without a code */
const FIRST_ORDER_CENTS = 100;

/** That discount as a percent of an item's price, rounded down so it's never overstated */
export const firstOrderPercent = (cents: number) => Math.min(100, Math.floor((FIRST_ORDER_CENTS * 100) / cents));

/** Menu sections the first-order discount works on */
export const FIRST_ORDER_CATEGORIES = [...DRINK_CATEGORIES, "fresas"];

export const isDrink = (item: { category: string }) => DRINK_CATEGORIES.includes(item.category);

type DiscountLine = { item: { category: string }; unit: number };
const firstOrderLines = <T extends DiscountLine>(lines: T[]) => lines.filter((l) => FIRST_ORDER_CATEGORIES.includes(l.item.category));

/** Nothing when the order has no drink or fresas */
export const firstOrderCents = (lines: DiscountLine[]) => (firstOrderLines(lines).length ? FIRST_ORDER_CENTS : 0);

/** The free drink covers the menu price of the priciest drink in the order; sizes and extras are still paid */
export function freeDrinkCents(lines: { item: { category: string; price: number } }[]): number {
  return Math.max(0, ...lines.filter((l) => isDrink(l.item)).map((l) => Math.round(l.item.price * 100)));
}

/** What a discount on an order was for; first orders show the percent on the cheapest item it works on, the biggest it can be */
export function discountLabel(pointsRedeemed: number, lines: DiscountLine[]) {
  if (pointsRedeemed > 0) return "Bebida gratis ⭐";
  const percent = firstOrderPercent(Math.min(...firstOrderLines(lines).map((l) => l.unit)));
  return `Primer pedido: ${percent}% en 1 bebida o fresas 🎉`;
}

/** "j***@gmail.com" */
export const maskEmail = (email: string) => email.replace(/^(.)[^@]*(@.*)$/, "$1***$2");
