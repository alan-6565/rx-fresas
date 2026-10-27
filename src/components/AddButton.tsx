"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

export function AddButton({ id, className = "" }: { id: string; className?: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => {
        add(id);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className={`rounded-full text-sm font-semibold px-4 py-2 transition-colors ${added ? "bg-ink text-white" : "bg-blush text-rose hover:bg-rose hover:text-white"} ${className}`}
    >
      {added ? "¡Agregado! ♥" : "+ Agregar"}
    </button>
  );
}
