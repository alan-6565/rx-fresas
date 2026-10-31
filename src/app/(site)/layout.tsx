import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart";
import { getMenu } from "@/lib/catalog";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const { items } = await getMenu();
  return (
    <CartProvider menu={items}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}
