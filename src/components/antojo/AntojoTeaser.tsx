"use client";

import { useEffect, useState } from "react";
import { CupPreview, type CupLook } from "@/components/antojo/CupPreview";

// The home page's cup, building itself over and over to invite people in
const LOOKS: CupLook[] = [
  { base: "fresa-original", size: "12-oz", crema: "casa", drizzles: [], toppings: [] },
  { base: "fresa-original", size: "16-oz", crema: "chocolate", drizzles: ["nutella"], toppings: ["granola"] },
  { base: "fresa-dubai", size: "16-oz", crema: "casa", drizzles: ["nutella"], toppings: ["oreo", "chocolate-chips"] },
  { base: "fresa-biscoff", size: "16-oz", crema: "casa", drizzles: ["lechera"], toppings: ["biscoff", "almendras"] },
  { base: "fresa-original", size: "12-oz", crema: "cafe", drizzles: ["lechera", "nutella"], toppings: ["mms", "coco"] },
];

export function AntojoTeaser() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % LOOKS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return <CupPreview look={LOOKS[i]} label="Un vaso de fresas con crema armándose con diferentes toppings" />;
}
