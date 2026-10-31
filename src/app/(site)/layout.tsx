import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart";
import { getMenu } from "@/lib/catalog";
import { EditLayer } from "@/components/EditLayer";
import { BusinessProvider } from "@/components/BusinessProvider";
import { getBusinessInfo } from "@/lib/business-info";
import { socialLinks } from "@/lib/business";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [{ items }, info] = await Promise.all([getMenu(), getBusinessInfo()]);
  return (
    <BusinessProvider links={socialLinks(info)}>
    <CartProvider menu={items}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <EditLayer />
    </CartProvider>
    </BusinessProvider>
  );
}
