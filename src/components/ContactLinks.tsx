"use client";

import { business } from "@/lib/data";
import { useBusiness } from "@/components/BusinessProvider";
import { ArrowRightIcon, FacebookIcon, InstagramIcon, MessageIcon, TikTokIcon } from "@/components/icons";

export function ContactLinks() {
  const b = useBusiness();
  const links = [
    { icon: InstagramIcon, label: "Síguenos en Instagram", sub: b.handle, href: b.instagram, tint: "text-[#d6249f]" },
    b.tiktok && { icon: TikTokIcon, label: "Síguenos en TikTok", sub: b.tiktok.replace("https://www.tiktok.com/", ""), href: b.tiktok, tint: "text-black" },
    b.facebook && { icon: FacebookIcon, label: "Síguenos en Facebook", sub: business.name, href: b.facebook, tint: "text-[#1877f2]" },
  ].filter((l) => !!l);

  return (
    <div className="space-y-3">
      {links.map(({ icon: Icon, label, sub, href, tint }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-full bg-white border border-line px-5 py-3 hover:border-rose transition-colors">
          <Icon className={`w-8 h-8 shrink-0 ${tint}`} />
          <span className="flex-1">
            <span className="block font-semibold leading-tight">{label}</span>
            <span className="block text-sm text-rose">{sub}</span>
          </span>
          <ArrowRightIcon className="w-5 h-5 text-ink-soft" />
        </a>
      ))}
      {(b.phone || b.email) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {b.phone && (
            <a href={b.phoneHref} className="rounded-full bg-white border border-line px-5 py-3 text-center hover:border-rose transition-colors">
              <span className="block text-xs text-ink-soft">Llámanos o mándanos texto</span>
              <span className="block font-semibold text-rose">{b.phone}</span>
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} className="rounded-full bg-white border border-line px-5 py-3 text-center hover:border-rose transition-colors">
              <span className="block text-xs text-ink-soft">Correo</span>
              <span className="block truncate font-semibold text-rose">{b.email}</span>
            </a>
          )}
        </div>
      )}
      <a href={b.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-5 py-4 transition-colors">
        <MessageIcon className="w-5 h-5" /> Contáctanos por Mensaje <ArrowRightIcon className="w-4 h-4" />
      </a>
    </div>
  );
}
