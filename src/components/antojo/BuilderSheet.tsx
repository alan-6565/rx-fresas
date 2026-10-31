"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/cart";
import { isFresa } from "@/lib/data";
import { Builder } from "@/components/antojo/Builder";
import { CloseIcon } from "@/components/icons";

/** The fresas builder in a box over the menu, opened by "Personalizar" on the fresas card */
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

  // On <body> so a card's hover lift (a transform) can't trap the fixed box inside it
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Personaliza tus fresas con crema"
        onClick={(e) => e.stopPropagation()}
        className="rx-pop flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] bg-cream shadow-2xl sm:rounded-[2rem]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-7">
          <p className="font-hand text-3xl leading-none sm:text-4xl">
            Personaliza tus Fresas <span className="text-rose">♡</span>
          </p>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full bg-white p-2 shadow">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7 sm:py-6">
          <Builder items={cups} initialId={initialId} sheet onAdded={() => setTimeout(onClose, 900)} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Opens the builder right away (old /crea-tu-antojo links land here) */
export function BuilderOnLoad() {
  const [open, setOpen] = useState(false);
  // After the page loads (the box lives on <body>, which the server doesn't have)
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
  }, []);
  return open ? <BuilderSheet onClose={() => setOpen(false)} /> : null;
}
