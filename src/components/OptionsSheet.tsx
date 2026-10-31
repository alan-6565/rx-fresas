"use client";

import { useEffect, useState } from "react";
import type { Item } from "@/lib/data";
import { money } from "@/lib/data";
import { defaultPicks, groupHint, priceSelection, type OptionGroup } from "@/lib/options";
import { Photo } from "@/components/ui";
import { CloseIcon } from "@/components/icons";

/**
 * "Personaliza tu orden": size, crema, toppings… Radio buttons for pick-one
 * groups, checkboxes (with a limit) for the rest. Bottom sheet on phones.
 */
export function OptionsSheet({ item, onAdd, onClose }: { item: Item; onAdd: (options: string[], qty: number) => void; onClose: () => void }) {
  const groups = item.options ?? [];
  const [picks, setPicks] = useState<string[]>(() => defaultPicks({ ...item, options: groups }));
  const [qty, setQty] = useState(1);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const count = (g: OptionGroup) => picks.filter((p) => p.startsWith(`${g.id}:`)).length;
  const toggle = (g: OptionGroup, choiceId: string) => {
    const key = `${g.id}:${choiceId}`;
    setPicks((prev) => {
      if (g.max === 1) return [...prev.filter((p) => !p.startsWith(`${g.id}:`)), key];
      if (prev.includes(key)) return prev.filter((p) => p !== key);
      if (count(g) >= g.max) return prev;
      return [...prev, key];
    });
  };

  let unit = Math.round(item.price * 100);
  let problem = "";
  try {
    unit = priceSelection({ ...item, options: groups }, picks).unit;
  } catch (e) {
    problem = (e as Error).message.replace(`${item.name}: `, "");
  }
  const missing = (g: OptionGroup) => count(g) < g.min;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-label={`Personaliza ${item.name}`}
        className="flex max-h-[92dvh] w-full sm:max-w-lg flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] bg-cream shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Photo src={item.image} alt={item.name} className="h-40 sm:h-48" sizes="512px" />
          <button onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <h2 className="mt-4 font-hand text-4xl leading-none">{item.name}</h2>
          {item.desc && <p className="mt-1 text-ink-soft">{item.desc}</p>}

          {groups.map((g) => (
            <fieldset key={g.id} className="mt-5">
              <legend className="flex w-full items-baseline justify-between gap-3">
                <span className="text-lg font-bold">{g.name}</span>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${tried && missing(g) ? "bg-rose text-white" : g.min > 0 ? "bg-blush text-rose" : "bg-white text-ink-soft border border-line"}`}>
                  {groupHint(g)}
                  {g.max > 1 && ` · ${count(g)}/${Math.min(g.max, g.choices.length)}`}
                </span>
              </legend>
              <div className="mt-2 grid gap-2">
                {g.choices
                  .filter((c) => c.available !== false)
                  .map((c) => {
                    const on = picks.includes(`${g.id}:${c.id}`);
                    const full = !on && g.max > 1 && count(g) >= g.max;
                    return (
                      <label
                        key={c.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${on ? "border-rose bg-blush" : "border-line bg-white"} ${full ? "opacity-50" : ""}`}
                      >
                        <input
                          type={g.max === 1 ? "radio" : "checkbox"}
                          name={`${item.id}-${g.id}`}
                          checked={on}
                          disabled={full}
                          onChange={() => toggle(g, c.id)}
                          className="h-5 w-5 accent-[var(--rose)]"
                        />
                        <span className="flex-1">{c.name}</span>
                        {c.price_cents > 0 && <span className="text-sm font-semibold text-rose">+{money(c.price_cents / 100)}</span>}
                      </label>
                    );
                  })}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="border-t border-line bg-white/80 px-5 py-4">
          {tried && problem && (
            <p role="alert" className="mb-2 text-center text-sm text-rose-dark">
              {problem.charAt(0).toUpperCase() + problem.slice(1)}
            </p>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-line bg-white">
              <button onClick={() => setQty((n) => Math.max(1, n - 1))} aria-label="Quitar uno" className="w-10 h-10 text-lg">
                −
              </button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty((n) => Math.min(20, n + 1))} aria-label="Agregar uno" className="w-10 h-10 text-lg">
                +
              </button>
            </div>
            <button
              onClick={() => {
                setTried(true);
                if (!problem) onAdd(picks, qty);
              }}
              className="flex-1 rounded-full bg-rose hover:bg-rose-dark text-white font-bold py-3 shadow-md"
            >
              Agregar · {money((unit * qty) / 100)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
