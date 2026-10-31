"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { CloseIcon, LogoutIcon, MenuIcon } from "@/components/admin/icons";
import { adminNav } from "@/components/admin/nav";

function Logo() {
  return (
    <Link href="/admin" aria-label="Dashboard" className="relative block w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-md">
      <Image src="/images/logo.png" alt="R&X Fresas con Crema" fill sizes="96px" className="object-cover" priority />
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const nav = (
    <nav className="mt-6 flex flex-col gap-1">
      {adminNav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors ${
            active(href) ? "bg-rose text-white shadow-sm" : "text-ink hover:bg-blush"
          }`}
        >
          <Icon className="w-5 h-5 shrink-0" />
          {label}
        </Link>
      ))}
      <button onClick={logout} className="mt-4 flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium text-ink-soft hover:bg-blush">
        <LogoutIcon className="w-5 h-5" />
        Log out
      </button>
    </nav>
  );

  return (
    <>
      {/* Phones and portrait iPads: top bar with a menu button */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-cream/95 backdrop-blur border-b border-line px-4 h-16">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 -ml-2">
          <MenuIcon className="w-6 h-6" />
        </button>
        <span className="font-hand text-2xl">R&amp;X Dashboard</span>
        <span className="w-10" />
      </div>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 bg-cream p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 -ml-2">
              <CloseIcon className="w-6 h-6" />
            </button>
            <Logo />
            {nav}
          </aside>
        </div>
      )}

      <aside className="hidden lg:block fixed inset-y-0 left-0 w-60 bg-cream border-r border-line p-5 overflow-y-auto">
        <Logo />
        {nav}
      </aside>
    </>
  );
}
