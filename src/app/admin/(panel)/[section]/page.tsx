import Link from "next/link";
import { notFound } from "next/navigation";
import { adminNav } from "@/components/admin/nav";
import { Card, PageHeader } from "@/components/admin/ui";

// Sections from the mockup that come in a later step
const SOON: Record<string, string> = {
  promotions: "Create banners, seasonal menus and specials for the website.",
  customers: "See who orders most and who keeps coming back.",
  analytics: "Sales, busiest hours and best sellers over time.",
};

export default async function ComingSoon({ params }: PageProps<"/admin/[section]">) {
  const { section } = await params;
  const item = adminNav.find((n) => n.href === `/admin/${section}`);
  if (!item || !SOON[section]) notFound();

  return (
    <>
      <PageHeader title={item.label} sub={SOON[section]} />
      <Card className="mt-6 p-10 text-center">
        <p className="font-hand text-4xl text-rose">Coming soon</p>
        <p className="mt-2 text-ink-soft">This part of the dashboard is next on the list.</p>
        <Link href="/admin/orders" className="mt-6 inline-flex rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-6 py-2.5">
          Go to Orders
        </Link>
      </Card>
    </>
  );
}
