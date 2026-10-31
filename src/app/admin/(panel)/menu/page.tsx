"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { money } from "@/lib/data";
import { Card, Field, Modal, PageHeader, Toggle, btn, field } from "@/components/admin/ui";
import { PhotoPicker } from "@/components/admin/PhotoPicker";
import { MenuBookIcon, PencilIcon, PlusIcon } from "@/components/admin/icons";

type Category = { id: string; label: string; title: string; sort: number };
type Item = { id: string; category_id: string; name: string; description: string; price_cents: number; image_url: string; available: boolean; sort: number };
type Draft = { id?: string; name: string; description: string; price: string; category: string; image: string; available: boolean };

const json = async <T,>(res: Response): Promise<T> => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong");
  return data as T;
};

export default function MenuAdmin() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[] | null>(null);
  const [tab, setTab] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [managing, setManaging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/menu", { cache: "no-store" })
      .then((res) => json<{ categories: Category[]; items: Item[] }>(res))
      .then((data) => {
        if (!alive) return;
        setCategories(data.categories);
        setItems(data.items);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  // Show/hide right away, then put it back if the save fails
  const setAvailable = async (item: Item, available: boolean) => {
    setItems((list) => list?.map((i) => (i.id === item.id ? { ...i, available } : i)) ?? null);
    try {
      await json(await fetch(`/api/admin/menu/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ available }) }));
    } catch (e) {
      setError((e as Error).message);
      setItems((list) => list?.map((i) => (i.id === item.id ? { ...i, available: !available } : i)) ?? null);
    }
  };

  const remove = async (item: Item) => {
    try {
      await json(await fetch(`/api/admin/menu/${item.id}`, { method: "DELETE" }));
      setItems((list) => list?.filter((i) => i.id !== item.id) ?? null);
      setDeleting(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // "All Items" follows the menu's category order, like the website
  const catOrder = (id: string) => categories.findIndex((c) => c.id === id);
  const shown = (items ?? []).filter((i) => tab === "all" || i.category_id === tab).sort((a, b) => catOrder(a.category_id) - catOrder(b.category_id) || a.sort - b.sort);
  const count = (id: string) => (items ?? []).filter((i) => i.category_id === id).length;
  const blank = (): Draft => ({ name: "", description: "", price: "", category: tab !== "all" ? tab : (categories[0]?.id ?? ""), image: "", available: true });

  return (
    <>
      <PageHeader title="Menu" sub="Add, edit or remove menu items. Changes will appear on your website.">
        <button onClick={() => setDraft(blank())} disabled={categories.length === 0} className={`${btn.primary} flex items-center gap-2`}>
          <PlusIcon className="w-4 h-4" /> Add New Item
        </button>
      </PageHeader>

      {error && (
        <p className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">
          {error}{" "}
          <button onClick={() => setError("")} className="underline">
            Dismiss
          </button>
        </p>
      )}

      <div className="mt-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[{ id: "all", label: "All Items" }, ...categories].map((c) => (
          <button
            key={c.id}
            onClick={() => setTab(c.id)}
            className={`shrink-0 rounded-lg border px-3.5 py-1.5 text-sm font-medium ${tab === c.id ? "bg-rose border-rose text-white" : "bg-white border-line hover:border-rose"}`}
          >
            {c.label} {c.id !== "all" && `(${count(c.id)})`}
          </button>
        ))}
        <button onClick={() => setManaging(true)} className="shrink-0 flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-rose hover:underline">
          <PencilIcon className="w-4 h-4" /> Categories
        </button>
      </div>

      {items === null ? (
        <p className="mt-10 text-center text-ink-soft">Loading menu…</p>
      ) : shown.length === 0 ? (
        <Card className="mt-5 p-12 text-center">
          <MenuBookIcon className="mx-auto w-10 h-10 text-rose/50" />
          <p className="mt-3 text-ink-soft">Nothing in this category yet.</p>
          <button onClick={() => setDraft(blank())} className={`${btn.primary} mt-4`}>
            Add an item
          </button>
        </Card>
      ) : (
        <div className="mt-5 grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {shown.map((item) => (
            <Card key={item.id} className={`overflow-hidden flex flex-col ${item.available ? "" : "opacity-60"}`}>
              <div className="relative aspect-[4/3] bg-blush">
                {item.image_url && <Image src={item.image_url} alt={item.name} fill sizes="(min-width:1280px) 22vw, (min-width:1024px) 30vw, (min-width:480px) 45vw, 90vw" className="object-cover" />}
                <div className="absolute right-2 top-2 flex items-center gap-2 rounded-full bg-white/90 px-2 py-1 shadow">
                  {!item.available && <span className="text-xs font-semibold text-ink-soft">Hidden</span>}
                  <Toggle on={item.available} onChange={(on) => setAvailable(item, on)} label={item.available ? `Hide ${item.name}` : `Show ${item.name}`} />
                </div>
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold leading-tight">{item.name}</h3>
                  <span className="font-bold text-rose">{money(item.price_cents / 100)}</span>
                </div>
                <p className="mt-1 text-sm text-ink-soft">{item.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <button
                  onClick={() =>
                    setDraft({
                      id: item.id,
                      name: item.name,
                      description: item.description,
                      price: (item.price_cents / 100).toFixed(2),
                      category: item.category_id,
                      image: item.image_url,
                      available: item.available,
                    })
                  }
                  className={btn.ghost}
                >
                  Edit
                </button>
                <button onClick={() => setDeleting(item)} className={btn.danger}>
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-ink-soft">The switch on each photo hides an item from the website (sold out, out of season) without deleting it.</p>

      {draft && (
        <ItemEditor
          draft={draft}
          categories={categories}
          onClose={() => setDraft(null)}
          onSaved={(saved) => {
            setItems((list) => (list?.some((i) => i.id === saved.id) ? list.map((i) => (i.id === saved.id ? saved : i)) : [...(list ?? []), saved]));
            setDraft(null);
          }}
        />
      )}

      {deleting && (
        <Modal
          title="Delete item?"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <button onClick={() => setDeleting(null)} className={btn.ghost}>
                Keep it
              </button>
              <button onClick={() => remove(deleting)} className={`${btn.primary} bg-rose-700`}>
                Delete {deleting.name}
              </button>
            </>
          }
        >
          <p>
            <strong>{deleting.name}</strong> will be removed from the menu for good. Past orders keep their details.
          </p>
          <p className="text-sm text-ink-soft">If it&apos;s only sold out or out of season, use the switch on its photo to hide it instead.</p>
        </Modal>
      )}

      {managing && <CategoryManager categories={categories} count={count} onClose={() => setManaging(false)} onChange={setCategories} />}
    </>
  );
}

function ItemEditor({ draft: start, categories, onClose, onSaved }: { draft: Draft; categories: Category[]; onClose: () => void; onSaved: (item: Item) => void }) {
  const [d, setD] = useState(start);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { name: d.name, description: d.description, price: Number(d.price), category: d.category, image: d.image, available: d.available };
      const res = await fetch(d.id ? `/api/admin/menu/${d.id}` : "/api/admin/menu", {
        method: d.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      onSaved((await json<{ item: Item }>(res)).item);
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={d.id ? "Edit item" : "New item"}
      onClose={onClose}
      footer={
        <>
          {error && <p className="mr-auto text-sm text-rose-700">{error}</p>}
          <button onClick={onClose} className={btn.ghost}>
            Cancel
          </button>
          <button onClick={save} disabled={saving || !d.name.trim() || !d.price} className={btn.primary}>
            {saving ? "Saving…" : d.id ? "Save changes" : "Add to menu"}
          </button>
        </>
      }
    >
      <PhotoPicker value={d.image} onChange={(image) => set({ image })} folder="menu" aspect="aspect-[2/1]" />
      <Field label="Name">
        <input value={d.name} onChange={(e) => set({ name: e.target.value })} maxLength={60} placeholder="Fresa con Nutella" className={field} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">$</span>
            <input value={d.price} onChange={(e) => set({ price: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" placeholder="9.00" className={`${field} pl-7`} />
          </div>
        </Field>
        <Field label="Category">
          <select value={d.category} onChange={(e) => set({ category: e.target.value })} className={field}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description" hint="Shown under the name on the website, in Spanish.">
        <textarea value={d.description} onChange={(e) => set({ description: e.target.value })} maxLength={160} rows={2} placeholder="Fresas, crema, nutella y toppings" className={`${field} resize-none`} />
      </Field>
      <div className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
        <span className="text-sm font-medium">Show on website</span>
        <Toggle on={d.available} onChange={(available) => set({ available })} label="Show on website" />
      </div>
    </Modal>
  );
}

function CategoryManager({ categories, count, onClose, onChange }: { categories: Category[]; count: (id: string) => number; onClose: () => void; onChange: (c: Category[]) => void }) {
  const [list, setList] = useState(categories);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const update = (next: Category[]) => {
    setList(next);
    onChange(next);
  };

  const rename = async (c: Category, patch: Partial<Category>) => {
    try {
      const { category } = await json<{ category: Category }>(
        await fetch(`/api/admin/categories/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }),
      );
      update(list.map((x) => (x.id === c.id ? category : x)));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const add = async () => {
    try {
      const { category } = await json<{ category: Category }>(
        await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: newName }) }),
      );
      update([...list, category]);
      setNewName("");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // Swap with the neighbor, then save both positions
  const move = async (index: number, dir: -1 | 1) => {
    const other = index + dir;
    if (other < 0 || other >= list.length) return;
    const next = [...list];
    [next[index], next[other]] = [next[other], next[index]];
    const renumbered = next.map((c, i) => ({ ...c, sort: i + 1 }));
    update(renumbered);
    try {
      await Promise.all(
        renumbered.map((c) => fetch(`/api/admin/categories/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sort: c.sort }) }).then((r) => json(r))),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async (c: Category) => {
    try {
      await json(await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE" }));
      update(list.filter((x) => x.id !== c.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Modal
      title="Categories"
      onClose={onClose}
      footer={
        <button onClick={onClose} className={btn.primary}>
          Done
        </button>
      }
    >
      <p className="text-sm text-ink-soft">The tab name and the heading customers see on the menu page. Changes save when you leave a box; ▲▼ sets the order.</p>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {list.map((c, index) => (
        <div key={c.id} className="rounded-xl border border-line bg-white p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex flex-col">
              <button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${c.label} up`} className="px-1 leading-none text-ink-soft disabled:opacity-30">
                ▲
              </button>
              <button onClick={() => move(index, 1)} disabled={index === list.length - 1} aria-label={`Move ${c.label} down`} className="px-1 leading-none text-ink-soft disabled:opacity-30">
                ▼
              </button>
            </span>
            <input defaultValue={c.label} onBlur={(e) => e.target.value.trim() !== c.label && rename(c, { label: e.target.value })} aria-label="Tab name" className={field} />
            <button
              onClick={() => remove(c)}
              disabled={count(c.id) > 0}
              title={count(c.id) > 0 ? "Move or delete its items first" : "Delete category"}
              className="shrink-0 text-sm font-semibold text-rose-700 disabled:text-ink-soft/50 px-2"
            >
              Delete
            </button>
          </div>
          <input defaultValue={c.title} onBlur={(e) => e.target.value.trim() !== c.title && rename(c, { title: e.target.value })} aria-label="Heading" placeholder="Heading" className={`${field} text-ink-soft`} />
          <p className="text-xs text-ink-soft">{count(c.id)} items</p>
        </div>
      ))}
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category, e.g. Para el Invierno" className={field} />
        <button onClick={add} disabled={!newName.trim()} className={btn.primary}>
          Add
        </button>
      </div>
    </Modal>
  );
}
