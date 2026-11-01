import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart";
import { getMenu } from "@/lib/catalog";
import { EditLayer } from "@/components/EditLayer";
import { BusinessProvider } from "@/components/BusinessProvider";
import { getBusinessInfo } from "@/lib/business-info";
import { socialLinks } from "@/lib/business";
import { getPromotions } from "@/lib/promotions-store";
import { PromoBar } from "@/components/promo/Promos";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [{ items }, info, promotions] = await Promise.all([getMenu(), getBusinessInfo(), getPromotions()]);
  return (
    <BusinessProvider links={socialLinks(info)}>
    <CartProvider menu={items}>
      <PromoBar promotions={promotions.filter((p) => p.on && p.banner)} />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <EditLayer />
    </CartProvider>
    </BusinessProvider>
  );
}
