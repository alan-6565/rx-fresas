"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Item } from "@/lib/data";
import { pickedSummary, priceSelection } from "@/lib/options";

/** `options` are "groupId:choiceId" picks; the same item with different picks is its own line */
export type CartItem = { id: string; qty: number; options?: string[] };

export type CartLine = CartItem & {
  key: string;
  options: string[];
  name: string;
  desc: string;
  image: string;
  /** Price of one, options included, in dollars */
  price: number;
  /** "16 oz · Chocolate · Nutella" */
  summary: string;
};

type CartContextValue = {
  /** What can be ordered right now (from the database) */
  menu: Item[];
  /** Cart lines for items still on the menu; hidden or changed ones drop out */
  lines: CartLine[];
  count: number;
  add: (id: string, options?: string[], qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rx-fresas-cart";

const keyOf = (i: CartItem) => [i.id, ...[...(i.options ?? [])].sort()].join("|");

// Pre-loaded like the "Tu Pedido" mockup so checkout looks filled in on first visit
const STARTER: CartItem[] = [
  { id: "fresa-original", qty: 1, options: ["tamano:12-oz", "crema:casa"] },
  { id: "malvavisco", qty: 1, options: ["estilo:latte"] },
  { id: "pancakes-15", qty: 1, options: ["frutas:fresa", "drizzles:nutella"] },
];

export function CartProvider({ menu, children }: { menu: Item[]; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(STARTER);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring saved cart after hydration
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  // Stable so effects can depend on it (the thank-you page clears the cart)
  const clear = useCallback(() => setItems([]), []);

  const lines = items.flatMap((i): CartLine[] => {
    const m = menu.find((x) => x.id === i.id);
    if (!m) return [];
    const options = i.options ?? [];
    try {
      // Drops lines whose options were changed on the menu since they were added
      const { unit, picked } = priceSelection({ ...m, options: m.options ?? [] }, options);
      return [{ ...i, key: keyOf(i), options, name: m.name, desc: m.desc, image: m.image, price: unit / 100, summary: pickedSummary(picked) }];
    } catch {
      return [];
    }
  });

  const value: CartContextValue = {
    menu,
    lines,
    count: lines.reduce((n, i) => n + i.qty, 0),
    add: (id, options = [], qty = 1) =>
      setItems((prev) => {
        const key = keyOf({ id, qty, options });
        return prev.some((i) => keyOf(i) === key) ? prev.map((i) => (keyOf(i) === key ? { ...i, qty: i.qty + qty } : i)) : [...prev, { id, qty, options }];
      }),
    setQty: (key, qty) => setItems((prev) => (qty < 1 ? prev.filter((i) => keyOf(i) !== key) : prev.map((i) => (keyOf(i) === key ? { ...i, qty } : i)))),
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
