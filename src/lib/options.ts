// Item options (size, crema, drizzles, toppings, add-ons). Shared by the menu,
// the cart, checkout and the dashboard, so a choice is checked and priced the
// same way everywhere. Option prices are added to the item's base price; the
// $1/item platform fee is per item, never per option.

export type Choice = { id: string; name: string; price_cents: number; available?: boolean };
/** min 0 = optional; max 1 = pick one (radio) */
export type OptionGroup = { id: string; name: string; min: number; max: number; choices: Choice[] };
/** What's saved on the order */
export type Picked = { group: string; name: string; price_cents: number };

type Priced = { price: number; options: OptionGroup[] };

const usable = (g: OptionGroup) => g.choices.filter((c) => c.available !== false);

/** "Elige 1", "Elige hasta 3", "Opcional" … for the customer */
export function groupHint(g: OptionGroup) {
  const max = Math.min(g.max, usable(g).length);
  if (g.min > 0 && g.min === max) return max === 1 ? "Elige 1" : `Elige ${max}`;
  if (g.min > 0) return `Elige de ${g.min} a ${max}`;
  return max === 1 ? "Opcional" : `Opcional · hasta ${max}`;
}

/** True when the item's price can go up depending on what's picked (show "Desde") */
export function hasRequiredUpcharge(item: Priced) {
  return item.options.some((g) => g.min > 0 && usable(g).some((c) => c.price_cents > 0));
}

/**
 * Checks a customer's picks against the item's groups and prices them.
 * Throws a Spanish message when something is missing or not allowed.
 */
export function priceSelection(item: Priced & { name: string }, chosen: string[]): { unit: number; picked: Picked[] } {
  const ids = new Set(chosen);
  if (ids.size !== chosen.length) throw new Error(`Opción repetida en ${item.name}`);

  const picked: Picked[] = [];
  let extra = 0;
  let matched = 0;
  for (const g of item.options) {
    const inGroup = usable(g).filter((c) => ids.has(`${g.id}:${c.id}`));
    if (inGroup.length < g.min) throw new Error(`${item.name}: ${g.name.toLowerCase()} — ${groupHint(g).toLowerCase()}`);
    if (inGroup.length > g.max) throw new Error(`${item.name}: demasiadas opciones en ${g.name.toLowerCase()}`);
    for (const c of inGroup) {
      picked.push({ group: g.name, name: c.name, price_cents: c.price_cents });
      extra += c.price_cents;
    }
    matched += inGroup.length;
  }
  // Anything left over is an option that was removed or hidden since it was added
  if (matched !== ids.size) throw new Error(`Algunas opciones de ${item.name} ya no están disponibles`);
  return { unit: Math.round(item.price * 100) + extra, picked };
}

/** "16 oz · Chocolate · Nutella, Oreo" for carts, tickets and Stripe */
export function pickedSummary(picked: Picked[]) {
  const byGroup = new Map<string, string[]>();
  for (const p of picked) byGroup.set(p.group, [...(byGroup.get(p.group) ?? []), p.name]);
  return [...byGroup.values()].map((names) => names.join(", ")).join(" · ");
}

/** The defaults a fresh pick starts with: the first choice of every "pick one" required group */
export function defaultPicks(item: Priced): string[] {
  return item.options.filter((g) => g.min === 1 && g.max === 1).flatMap((g) => (usable(g)[0] ? [`${g.id}:${usable(g)[0].id}`] : []));
}

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30) || "x";

/**
 * Cleans up groups sent from the dashboard. Keeps existing ids (so carts stay
 * valid) and makes ids for new ones. Throws an English message for the staff.
 */
export function cleanGroups(input: unknown): OptionGroup[] {
  if (!Array.isArray(input)) throw new Error("Options must be a list.");
  if (input.length > 12) throw new Error("That's a lot of option groups (12 max).");
  const groupIds = new Set<string>();
  return input.map((raw) => {
    const g = raw as Partial<OptionGroup>;
    const name = String(g.name ?? "").trim().slice(0, 40);
    if (!name) throw new Error("Every option group needs a name, like “Tamaño”.");
    if (!Array.isArray(g.choices) || g.choices.length === 0) throw new Error(`Add at least one choice to “${name}”.`);
    if (g.choices.length > 30) throw new Error(`“${name}” has too many choices (30 max).`);

    let id = typeof g.id === "string" && /^[a-z0-9-]{1,40}$/.test(g.id) ? g.id : slug(name);
    for (let n = 2; groupIds.has(id); n++) id = `${slug(name)}-${n}`;
    groupIds.add(id);

    const choiceIds = new Set<string>();
    const choices = g.choices.map((rc) => {
      const c = rc as Partial<Choice>;
      const cname = String(c.name ?? "").trim().slice(0, 40);
      if (!cname) throw new Error(`A choice in “${name}” has no name.`);
      const price = Math.round(Number(c.price_cents ?? 0));
      if (!Number.isFinite(price) || price < 0 || price > 5000) throw new Error(`“${cname}” extra price must be between $0 and $50.`);
      let cid = typeof c.id === "string" && /^[a-z0-9-]{1,40}$/.test(c.id) ? c.id : slug(cname);
      for (let n = 2; choiceIds.has(cid); n++) cid = `${slug(cname)}-${n}`;
      choiceIds.add(cid);
      return { id: cid, name: cname, price_cents: price, ...(c.available === false ? { available: false } : {}) };
    });

    const min = Math.max(0, Math.min(Math.floor(Number(g.min ?? 0)), choices.length));
    const max = Math.max(1, Math.min(Math.floor(Number(g.max ?? 1)), choices.length));
    if (min > max) throw new Error(`In “${name}”, the minimum can't be more than the maximum.`);
    return { id, name, min, max, choices };
  });
}
