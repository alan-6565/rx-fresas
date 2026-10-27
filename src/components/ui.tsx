import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, HeartDoodle } from "@/components/icons";

export function Button({
  href,
  children,
  variant = "solid",
  arrow = true,
  icon,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline" | "light";
  arrow?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  const styles = {
    solid: "bg-rose hover:bg-rose-dark text-white shadow-md",
    outline: "border-2 border-rose text-rose hover:bg-rose hover:text-white",
    light: "border-2 border-white text-white hover:bg-white hover:text-ink",
  }[variant];
  return (
    <Link href={href} className={`inline-flex items-center justify-center gap-2.5 rounded-full font-semibold px-7 py-3 transition-colors ${styles} ${className}`}>
      {icon}
      {children}
      {arrow && <ArrowRightIcon className="w-4 h-4" />}
    </Link>
  );
}

/** Hand-lettered heading with a doodle heart, like "Nuestro Menú ♡" */
export function Heading({ children, as = "h2", sub, className = "" }: { children: React.ReactNode; as?: "h1" | "h2"; sub?: string; className?: string }) {
  const Tag = as;
  const size = as === "h1" ? "text-6xl sm:text-7xl" : "text-5xl sm:text-6xl";
  return (
    <div className={className}>
      <Tag className={`inline-flex items-center gap-3 font-hand text-ink leading-none ${size}`}>
        {children}
        <HeartDoodle className={`${as === "h1" ? "w-10 h-10" : "w-8 h-8"} text-rose rotate-12 shrink-0`} />
      </Tag>
      {sub && <p className="mt-3 text-lg text-ink-soft">{sub}</p>}
    </div>
  );
}

/** Pink handwritten "Hecho con amor para nuestra comunidad" note */
export function LoveNote({ className = "" }: { className?: string }) {
  return (
    <p className={`font-script text-rose leading-snug -rotate-6 ${className}`}>
      Hecho con amor
      <br />
      para nuestra
      <br />
      comunidad ♡
    </p>
  );
}

export function Photo({ src, alt, className = "", sizes = "50vw", priority = false, fit = "object-cover" }: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean; fit?: string }) {
  return (
    <div className={`${className.includes("absolute") ? "" : "relative"} overflow-hidden ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={fit} />
    </div>
  );
}

export function PageTop({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-8 sm:pt-12">{children}</div>;
}
