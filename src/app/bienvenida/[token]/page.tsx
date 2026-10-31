import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMenu, getSpots } from "@/lib/catalog";
import { hoursSummary } from "@/lib/schedule";
import { money } from "@/lib/data";
import { getIntake, validIntakeToken } from "@/lib/intake";
import { IntakeForm, type MenuReview, type SpotReview } from "./IntakeForm";

// The owners' questionnaire. Anyone with the link can open it, so the link
// itself is the password (Dashboard → Settings can make a new one).

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bienvenidos — R&X Fresas con Crema", robots: { index: false, follow: false } };

export default async function IntakePage({ params }: PageProps<"/bienvenida/[token]">) {
  const { token } = await params;
  if (!(await validIntakeToken(token))) notFound();
  const [intake, spots, menu] = await Promise.all([getIntake(), getSpots(), getMenu()]);

  const spotList: SpotReview[] = spots.map((s) => ({ id: s.id, name: s.name, address: s.address, city: s.city, hours: hoursSummary(s.hours) }));
  const menuList: MenuReview[] = menu.categories
    .map((c) => ({
      title: c.title,
      items: menu.items
        .filter((i) => i.category === c.id)
        .map((i) => ({
          name: i.name,
          price: money(i.price),
          options: (i.options ?? []).map(
            (g) => `${g.name}: ${g.choices.map((ch) => (ch.price_cents ? `${ch.name} (+${money(ch.price_cents / 100)})` : ch.name)).join(", ")}`,
          ),
        })),
    }))
    .filter((c) => c.items.length);

  return <IntakeForm token={token} initial={intake} spots={spotList} menu={menuList} />;
}
