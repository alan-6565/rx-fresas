"use client";

import type { Choice, OptionGroup } from "@/lib/options";
import { Toggle, btn, field } from "@/components/admin/ui";
import { PlusIcon } from "@/components/admin/icons";

// The "Options" part of the menu item editor: groups like Tamaño, Crema,
// Toppings, each with its choices and an optional extra price.

const newId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export function OptionsEditor({
  groups,
  onChange,
  copyFrom,
}: {
  groups: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
  /** Other items that have options, to copy theirs */
  copyFrom: { name: string; options: OptionGroup[] }[];
}) {
  const setGroup = (i: number, patch: Partial<OptionGroup>) => onChange(groups.map((g, n) => (n === i ? { ...g, ...patch } : g)));
  const setChoice = (gi: number, ci: number, patch: Partial<Choice>) =>
    setGroup(gi, { choices: groups[gi].choices.map((c, n) => (n === ci ? { ...c, ...patch } : c)) });
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span>
          <span className="block text-sm font-semibold">Options</span>
          <span className="block text-xs text-ink-soft">Size, crema, toppings… Customers pick these before adding to their order.</span>
        </span>
        {copyFrom.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              const src = copyFrom[Number(e.target.value)];
              if (src) onChange([...groups, ...structuredClone(src.options)]);
            }}
            className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs"
            aria-label="Copy options from another item"
          >
            <option value="">Copy from…</option>
            {copyFrom.map((c, i) => (
              <option key={i} value={i}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {groups.map((g, gi) => (
        <div key={g.id} className="mt-4 rounded-xl border border-line bg-cream/60 p-3">
          <div className="flex items-center gap-2">
            <span className="flex flex-col">
              <button type="button" onClick={() => move(gi, -1)} disabled={gi === 0} aria-label="Move up" className="px-1 leading-none text-ink-soft disabled:opacity-30">
                ▲
              </button>
              <button type="button" onClick={() => move(gi, 1)} disabled={gi === groups.length - 1} aria-label="Move down" className="px-1 leading-none text-ink-soft disabled:opacity-30">
                ▼
              </button>
            </span>
            <input value={g.name} onChange={(e) => setGroup(gi, { name: e.target.value })} placeholder="Group name, e.g. Tamaño" aria-label="Group name" className={`${field} font-semibold`} />
            <button type="button" onClick={() => onChange(groups.filter((_, n) => n !== gi))} className="shrink-0 px-2 text-sm font-semibold text-rose-700">
              Remove
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <Toggle on={g.min > 0} onChange={(on) => setGroup(gi, { min: on ? 1 : 0 })} label="Required" />
              Required
            </label>
            <label className="flex items-center gap-2">
              Pick up to
              <input
                type="number"
                min={1}
                max={Math.max(1, g.choices.length)}
                value={g.max}
                onChange={(e) => setGroup(gi, { max: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                className="w-16 rounded-lg border border-line bg-white px-2 py-1"
              />
            </label>
            <span className="text-xs text-ink-soft">{g.max === 1 ? "Customers pick one" : `Customers pick up to ${g.max}`}</span>
          </div>

          <ul className="mt-2 space-y-1.5">
            {g.choices.map((c, ci) => (
              <li key={c.id} className="flex items-center gap-2">
                <input value={c.name} onChange={(e) => setChoice(gi, ci, { name: e.target.value })} placeholder="Choice" aria-label="Choice name" className={`${field} py-1.5`} />
                <span className="relative shrink-0">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-ink-soft">+$</span>
                  <input
                    key={`${c.id}-${c.price_cents}`}
                    defaultValue={c.price_cents ? (c.price_cents / 100).toFixed(2) : ""}
                    onBlur={(e) => setChoice(gi, ci, { price_cents: Math.max(0, Math.round(Number(e.target.value.replace(/[^\d.]/g, "")) * 100) || 0) })}
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label={`Extra price for ${c.name}`}
                    className="w-20 rounded-lg border border-line bg-white py-1.5 pl-6 pr-2 text-sm"
                  />
                </span>
                <Toggle on={c.available !== false} onChange={(on) => setChoice(gi, ci, { available: on })} label={`${c.name} available`} />
                <button
                  type="button"
                  onClick={() => setGroup(gi, { choices: g.choices.filter((_, n) => n !== ci) })}
                  aria-label={`Remove ${c.name}`}
                  className="shrink-0 px-1 text-xl leading-none text-ink-soft hover:text-rose-700"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setGroup(gi, { choices: [...g.choices, { id: newId("c"), name: "", price_cents: 0 }] })}
            className="mt-2 text-sm font-semibold text-rose hover:underline"
          >
            + Add choice
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...groups, { id: newId("g"), name: "", min: 0, max: 1, choices: [{ id: newId("c"), name: "", price_cents: 0 }] }])}
        className={`${btn.ghost} mt-4 flex w-full items-center justify-center gap-2`}
      >
        <PlusIcon className="w-4 h-4" /> Add option group
      </button>
      {groups.length > 0 && <p className="mt-2 text-xs text-ink-soft">The switch next to a choice hides it (sold out) without deleting it.</p>}
    </div>
  );
}
