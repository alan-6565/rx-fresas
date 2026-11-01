import { getPromotions } from "@/lib/promotions-store";
import { PageHeader } from "@/components/admin/ui";
import { PromotionsView } from "./PromotionsView";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const promotions = await getPromotions();
  return (
    <>
      <PageHeader title="Promotions" sub="Specials, new drinks and announcements. They show on the website on the days you pick." />
      <PromotionsView initial={promotions} />
    </>
  );
}
