"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { items as menu } from "@/lib/data";

export type CartItem = { id: string; qty: number };

type CartContextValue = {
  lines: (CartItem & { name: string; desc: string; image: string; price: number })[];
  count: number;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "rx-fresas-cart";

// Pre-loaded like the "Tu Pedido" mockup so checkout looks filled in on first visit
const STARTER: CartItem[] = [
  { id: "fresa-especial", qty: 1 },
  { id: "caramel", qty: 1 },
  { id: "pancakes-15", qty: 1 },
];

export function CartProvider({ children }: { children: React.ReactNode }) {
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

  const lines = items.flatMap((i) => {
    const m = menu.find((x) => x.id === i.id);
    return m ? [{ ...i, name: m.name, desc: m.desc, image: m.image, price: m.price }] : [];
  });

  const value: CartContextValue = {
    lines,
    count: lines.reduce((n, i) => n + i.qty, 0),
    add: (id) =>
      setItems((prev) => (prev.some((i) => i.id === id) ? prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { id, qty: 1 }])),
    setQty: (id, qty) => setItems((prev) => (qty < 1 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i)))),
    clear: () => setItems([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
