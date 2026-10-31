import type { Metadata, Viewport } from "next";
import Sidebar from "@/components/admin/Sidebar";

export const metadata: Metadata = {
  title: "R&X Dashboard",
  manifest: "/admin.webmanifest",
  appleWebApp: { capable: true, title: "R&X Orders", statusBarStyle: "default" },
  icons: { apple: "/images/admin-icon-192.png" },
  robots: { index: false },
};

export const viewport: Viewport = { themeColor: "#e8506a" };

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-screen bg-[#fbeeec]">
      <Sidebar />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8 py-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
