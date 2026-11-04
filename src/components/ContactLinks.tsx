"use client";

import { business } from "@/lib/data";
import { useBusiness } from "@/components/BusinessProvider";
import { ArrowRightIcon, FacebookIcon, MessageIcon } from "@/components/icons";

// The Contacto cards from the mockup: big rounded Instagram / TikTok rows,
// phone and email side by side, then one pink "message us" button.

function InstagramColor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="rx-ig" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#feda75" />
          <stop offset=".35" stopColor="#fa7e1e" />
          <stop offset=".6" stopColor="#d62976" />
          <stop offset=".85" stopColor="#962fbf" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#rx-ig)" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.3" stroke="url(#rx-ig)" strokeWidth="2.2" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="url(#rx-ig)" />
    </svg>
  );
}

const TIKTOK = "M16.6 3c.3 2.2 1.6 3.7 3.9 3.9v3.1c-1.4.1-2.7-.3-3.9-1v6.3c0 3.6-2.9 5.7-5.8 5.7a5.6 5.6 0 0 1-5.6-5.6c0-3.5 3.1-6 6.6-5.5v3.2c-1.6-.4-3.4.6-3.4 2.4 0 1.4 1.1 2.4 2.4 2.4 1.5 0 2.6-1 2.6-2.8V3h3.2Z";
function TikTokColor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={TIKTOK} fill="#25f4ee" transform="translate(-.8 -.6)" />
      <path d={TIKTOK} fill="#fe2c55" transform="translate(.8 .6)" />
      <path d={TIKTOK} fill="#111" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 3.5h3.2l1.6 4.2-2.1 1.4a11 11 0 0 0 7.2 7.2l1.4-2.1 4.2 1.6V19a1.8 1.8 0 0 1-1.9 1.8C10.2 20.3 3.7 13.8 3.2 5.4A1.8 1.8 0 0 1 5 3.5Z" />
    </svg>
  );
}

const card = "rx-pop flex items-center gap-4 sm:gap-5 rounded-[2rem] bg-white/95 shadow-[0_6px_24px_rgba(232,80,106,.12)] border border-white hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(232,80,106,.2)] transition-all";

export function ContactLinks() {
  const b = useBusiness();
  const handle = b.handle.replace(/^@/, "");
  const links = [
    { icon: InstagramColor, label: "Síguenos en Instagram", sub: b.handle, href: b.instagram },
    b.tiktok && { icon: TikTokColor, label: "Síguenos en TikTok", sub: b.tiktok.replace("https://www.tiktok.com/", ""), href: b.tiktok },
    b.facebook && { icon: ({ className }: { className?: string }) => <FacebookIcon className={`${className} text-[#1877f2]`} />, label: "Síguenos en Facebook", sub: business.name, href: b.facebook },
  ].filter((l) => !!l);

  return (
    <div>
      <div className="mx-auto max-w-[44rem] space-y-4">
        {links.map(({ icon: Icon, label, sub, href }, i) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" className={`${card} px-6 sm:px-10 py-5`} style={{ animationDelay: `${i * 80}ms` }}>
            <Icon className="w-11 h-11 sm:w-12 sm:h-12 shrink-0" />
            <span className="flex-1 min-w-0 text-left">
              <span className="block font-bold text-lg sm:text-xl leading-tight">{label}</span>
              <span className="block truncate font-semibold text-rose">{sub}</span>
            </span>
            <ArrowRightIcon className="w-6 h-6 text-ink shrink-0" />
          </a>
        ))}
      </div>

      {(b.phone || b.email) && (
        <div className="mx-auto max-w-[49rem] mt-4 grid gap-4 sm:grid-cols-2">
          {b.phone && (
            <a href={b.phoneHref} className={`${card} px-6 sm:px-8 py-5`} style={{ animationDelay: "160ms" }}>
              <PhoneIcon className="w-9 h-9 shrink-0 text-rose" />
              <span className="min-w-0 text-left">
                <span className="block text-sm font-medium">Llámanos o mándanos texto</span>
                <span className="block font-bold text-xl sm:text-2xl text-rose leading-tight">{b.phone}</span>
              </span>
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} className={`${card} px-6 sm:px-8 py-5`} style={{ animationDelay: "220ms" }}>
              <MessageIcon className="w-9 h-9 shrink-0 text-rose" />
              <span className="min-w-0 text-left">
                <span className="block text-sm font-medium">Correo</span>
                <span className="block truncate font-bold text-lg text-rose leading-tight">{b.email}</span>
              </span>
            </a>
          )}
        </div>
      )}

      {/* Opens a DM to them on Instagram */}
      <a
        href={`https://ig.me/m/${handle}`}
        target="_blank"
        rel="noreferrer"
        className="rx-pop mx-auto max-w-[47rem] mt-7 flex items-center justify-center gap-3 rounded-full bg-rose hover:bg-rose-dark text-white text-lg sm:text-xl font-semibold px-6 py-5 shadow-lg shadow-rose/30 transition-colors"
        style={{ animationDelay: "280ms" }}
      >
        <MessageIcon className="w-6 h-6" /> Contáctanos por Mensaje <ArrowRightIcon className="w-5 h-5" />
      </a>
    </div>
  );
}
