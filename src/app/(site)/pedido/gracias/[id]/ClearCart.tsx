"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

/** Empties the cart once the order is paid */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => clear(), [clear]);
  return null;
}
