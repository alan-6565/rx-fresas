import Link from "next/link";
import { business, navLinks } from "@/lib/data";
import { getSpots } from "@/lib/catalog";
import { hoursSummary } from "@/lib/schedule";
import { Handle, Logo, Socials } from "@/components/Navbar";
import { ClockIcon, PinIcon } from "@/components/icons";

export default async function Footer() {
  const spots = await getSpots();
  return (
    <footer className="mt-20 bg-night text-cream">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 grid gap-10 md:grid-cols-[auto_1fr_auto] items-center text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-3">
          <Logo className="w-24 h-24" />
          <p className="font-script text-xl text-rose-soft">Hecho con amor ♡</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-cream/80">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-rose-soft">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col items-center md:items-end gap-2 text-sm text-cream/80">
          {spots.map((l) => (
            <span key={l.id} className="flex items-center gap-2">
              <PinIcon className="w-5 h-5 text-rose-soft" /> {l.name}, {l.city}
            </span>
          ))}
          {spots[0] &&
            hoursSummary(spots[0].hours).map((h) => (
              <span key={h} className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-rose-soft" /> {h}
              </span>
            ))}
          <div className="mt-2 flex items-center gap-4 text-cream">
            <Socials />
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10 py-4 text-center text-xs text-cream/50">
        © {business.name} · {business.city} · <Handle />
      </div>
    </footer>
  );
}
