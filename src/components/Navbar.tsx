"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks } from "@/lib/data";
import { useBusiness } from "@/components/BusinessProvider";
import { useCart } from "@/lib/cart";
import { ArrowRightIcon, BagIcon, CloseIcon, FacebookIcon, InstagramIcon, MenuIcon, TikTokIcon } from "@/components/icons";

export function Logo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <Link href="/" aria-label="R&X Fresas con Crema, inicio" className={`relative shrink-0 block rounded-full bg-cream shadow-lg ring-4 ring-white ${className}`}>
      <Image src="/images/logo-v2.png" alt="R&X Fresas con Crema" fill sizes="120px" className="object-cover rounded-full" priority />
    </Link>
  );
}

export function Socials({ className = "w-5 h-5" }: { className?: string }) {
  const links = useBusiness();
  return (
    <>
      <a href={links.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-rose">
        <InstagramIcon className={className} />
      </a>
      {links.tiktok && (
        <a href={links.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="hover:text-rose">
          <TikTokIcon className={className} />
        </a>
      )}
      {links.facebook && (
        <a href={links.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:text-rose">
          <FacebookIcon className={className} />
        </a>
      )}
    </>
  );
}

/** "@rx_fresasconcrema", for server pages that show the handle */
export function Handle() {
  return <>{useBusiness().handle}</>;
}

export default function Navbar() {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 h-24 sm:h-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-3 flex items-start gap-4">
        <Logo className="w-18 h-18 sm:w-28 sm:h-28" />

        <div className="flex-1 mt-2 sm:mt-5 h-14 rounded-full bg-cream/95 backdrop-blur shadow-md flex items-center justify-between gap-3 pl-3 xl:pl-6 pr-2">
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 transition-colors ${isActive(link.href) ? "bg-blush text-rose" : "hover:text-rose"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? "Cerrar menú" : "Abrir menú"} className="xl:hidden p-2">
            {open ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <Socials />
            </div>
            <Link
              href="/pedido"
              className="relative inline-flex items-center gap-2 rounded-full bg-rose hover:bg-rose-dark text-white font-semibold text-sm px-4 sm:px-5 py-2.5 transition-colors"
            >
              <BagIcon className="w-5 h-5" />
              Order Now
              <ArrowRightIcon className="hidden sm:block w-4 h-4" />
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-white text-rose ring-2 ring-rose text-[11px] font-bold">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <nav className="xl:hidden mx-4 mt-2 rounded-3xl bg-cream shadow-xl p-3 flex flex-col">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`rounded-2xl px-4 py-3 text-lg font-medium ${isActive(link.href) ? "bg-blush text-rose" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex items-center gap-5 px-4 pt-3 pb-1">
            <Socials className="w-6 h-6" />
          </div>
        </nav>
      )}
    </header>
  );
}
