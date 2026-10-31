"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { isFresa } from "@/lib/data";
import { Builder } from "@/components/antojo/Builder";
import { CloseIcon } from "@/components/icons";

/** The fresas builder over the page, opened by "Ordenar" on any fresas con crema */
export function BuilderSheet({ initialId, onClose }: { initialId?: string; onClose: () => void }) {
  const { menu } = useCart();
  const cups = menu.filter(isFresa);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto overscroll-contain bg-cream" role="dialog" aria-label="Arma tus fresas con crema">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-cream/95 px-4 py-3 backdrop-blur sm:px-8">
        <p className="font-hand text-3xl leading-none sm:text-4xl">
          Fresas con Crema <span className="text-rose">♡</span>
        </p>
        <button onClick={onClose} aria-label="Cerrar" className="rounded-full bg-white p-2 shadow">
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="mx-auto max-w-6xl px-4 pt-5 pb-10 sm:px-8">
        <Builder items={cups} initialId={initialId} sheet onAdded={() => setTimeout(onClose, 900)} />
      </div>
    </div>
  );
}
