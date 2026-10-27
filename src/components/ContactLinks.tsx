import { business } from "@/lib/data";
import { ArrowRightIcon, FacebookIcon, InstagramIcon, MessageIcon, TikTokIcon } from "@/components/icons";

const links = [
  { icon: InstagramIcon, label: "Síguenos en Instagram", sub: business.handle, href: business.instagram, tint: "text-[#d6249f]" },
  { icon: TikTokIcon, label: "Síguenos en TikTok", sub: business.handle, href: business.tiktok, tint: "text-black" },
  { icon: FacebookIcon, label: "Síguenos en Facebook", sub: business.name, href: business.facebook, tint: "text-[#1877f2]" },
];

export function ContactLinks() {
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
      <a href={business.instagram} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 rounded-full bg-rose hover:bg-rose-dark text-white font-semibold px-5 py-4 transition-colors">
        <MessageIcon className="w-5 h-5" /> Contáctanos por Mensaje <ArrowRightIcon className="w-4 h-4" />
      </a>
    </div>
  );
}
