"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { OptionsSheet } from "@/components/OptionsSheet";
import { BuilderSheet } from "@/components/antojo/BuilderSheet";
import { isFresa } from "@/lib/data";

/** "+ Agregar": straight into the cart, or first through the options sheet if the item has any */
export function AddButton({ id, className = "", variant = "soft" }: { id: string; className?: string; variant?: "soft" | "outline" }) {
  const { add, menu } = useCart();
  const [added, setAdded] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const item = menu.find((m) => m.id === id);
  const hasOptions = !!item?.options?.length;
  const fresa = !!item && isFresa(item);

  const done = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <>
      <button
        onClick={() => {
          if (hasOptions) return setChoosing(true);
          add(id);
          done();
        }}
        className={`rounded-full text-sm font-semibold transition-colors ${variant === "outline" ? "mt-3 border-2 px-5 py-2 text-base" : "px-4 py-2"} ${added ? "bg-ink border-ink text-white" : variant === "outline" ? "border-rose/70 bg-white text-rose hover:bg-rose hover:border-rose hover:text-white" : "bg-blush text-rose hover:bg-rose hover:text-white"} ${className}`}
      >
        {added ? "¡Agregado! ♥" : hasOptions ? "+ Personalizar" : "+ Agregar"}
      </button>
      {choosing && item && fresa && <BuilderSheet initialId={id} onClose={() => setChoosing(false)} />}
      {choosing && item && !fresa && (
        <OptionsSheet
          item={item}
          onClose={() => setChoosing(false)}
          onAdd={(options, qty) => {
            add(id, options, qty);
            setChoosing(false);
            done();
          }}
        />
      )}
    </>
  );
}
