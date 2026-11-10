import { headers } from "next/headers";
import { getBusinessInfo } from "@/lib/business-info";
import { getMenu, getSpots } from "@/lib/catalog";
import { getIntake, getIntakeToken } from "@/lib/intake";
import { PageHeader } from "@/components/admin/ui";
import { paymentsStatus } from "@/lib/payments";
import { SettingsView } from "./SettingsView";
import { PaymentsCard } from "./PaymentsCard";
import { DeliveryCard } from "./DeliveryCard";
import { EmailCard } from "./EmailCard";
import { getDelivery } from "@/lib/delivery-store";
import { emailReady } from "@/lib/email";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const [token, intake, info, spots, h, menu, payments, delivery, { stripe }] = await Promise.all([getIntakeToken(), getIntake(), getBusinessInfo(), getSpots(), headers(), getMenu(), paymentsStatus(), getDelivery(), searchParams]);
  const host = h.get("host") ?? "www.ryxfresasandcoffee.com";
  const origin = `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
  return (
    <>
      <PageHeader title="Settings" sub="Payments, delivery, the owners' questionnaire, and the contact info and social links shown on the website." />
      <div className="mt-6">
        <PaymentsCard status={payments} back={stripe === "back"} />
      </div>
      <div className="mt-6">
        <DeliveryCard initial={delivery} emailOn={emailReady()} />
      </div>
      <div className="mt-6">
        <EmailCard configured={emailReady()} />
      </div>
      <SettingsView origin={origin} token={token} intake={intake} info={info} names={{ spots: Object.fromEntries(spots.map((s) => [s.id, s.name])), categories: Object.fromEntries(menu.categories.filter((c) => menu.items.some((i) => i.category === c.id)).map((c) => [c.id, c.title])) }} />
    </>
  );
}
