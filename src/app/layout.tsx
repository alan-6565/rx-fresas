import type { Metadata } from "next";
import { Caveat_Brush, DM_Sans, Kaushan_Script } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart";

const caveatBrush = Caveat_Brush({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: "400",
});

const kaushan = Kaushan_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const dmSans = DM_Sans({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "R&X Fresas con Crema — Cafés, Fresas y Mini Pancakes | Richmond, CA",
  description: "Bebidas, antojos y momentos más dulces para tu día. Food truck en Richmond, CA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${caveatBrush.variable} ${kaushan.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink font-ui">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
