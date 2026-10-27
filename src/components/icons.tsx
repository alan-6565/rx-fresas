type IconProps = { className?: string };

const stroke = { stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function BagIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 8h14l-1 12.5H6L5 8Z" {...stroke} />
      <path d="M9 10V6.5a3 3 0 0 1 6 0V10" {...stroke} />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" {...stroke} strokeWidth={2} />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" {...stroke} strokeWidth={2} />
      <circle cx="12" cy="12" r="4.2" {...stroke} strokeWidth={2} />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" {...stroke} strokeWidth={2} />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12M18 6 6 18" {...stroke} strokeWidth={2} />
    </svg>
  );
}

/** Hand-drawn style heart outline */
export function HeartDoodle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 34C12 27 5 21 6 13.5 7 8 13.5 6.5 17 10.5c1.3 1.4 2.2 3 3 4.7.9-2 2-3.8 3.6-5.2C27.4 6.6 33.6 8 34.4 13.5 35.4 21 27.5 27.5 20 34Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CupIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M8 10h16l-1.8 17a2 2 0 0 1-2 1.8h-8.4a2 2 0 0 1-2-1.8L8 10Z" {...stroke} />
      <path d="M7 10h18M18 10l2-7h3" {...stroke} />
      <path d="M16 23s-3.2-1.9-3.2-4.2a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 2.3-3.2 4.2-3.2 4.2Z" {...stroke} />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M4 15 16 5l12 10M7 13v14h18V13" {...stroke} />
      <path d="M13 27v-7h6v7" {...stroke} />
    </svg>
  );
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="10" r="3.5" {...stroke} />
      <circle cx="8" cy="13" r="2.8" {...stroke} />
      <circle cx="24" cy="13" r="2.8" {...stroke} />
      <path d="M10 24c0-4 2.7-7 6-7s6 3 6 7M3.5 24c0-3 2-5.5 4.5-5.5M28.5 24c0-3-2-5.5-4.5-5.5" {...stroke} />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 28s9-8.6 9-15a9 9 0 1 0-18 0c0 6.4 9 15 9 15Z" {...stroke} />
      <circle cx="16" cy="13" r="3.3" {...stroke} />
    </svg>
  );
}


export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M18 3 7 18h8l-2 11 12-16h-8l1-10Z" {...stroke} />
    </svg>
  );
}

export function PancakeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M5 14c0-2 5-3.5 11-3.5S27 12 27 14s-5 3.5-11 3.5S5 16 5 14Z" {...stroke} />
      <path d="M5 14v3c0 2 5 3.5 11 3.5S27 19 27 17v-3M5 17v3c0 2 5 3.5 11 3.5S27 22 27 20v-3M5 20v3c0 2 5 3.5 11 3.5S27 25 27 23v-3" {...stroke} />
      <path d="M14 10.5c0-2 1-3.5 2-4.5 1 1 2 2.5 2 4.5" {...stroke} />
    </svg>
  );
}

export function CarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M5 21v-5l3-6h16l3 6v5H5Z" {...stroke} />
      <path d="M5 16h22" {...stroke} />
      <circle cx="10" cy="22" r="2.5" {...stroke} />
      <circle cx="22" cy="22" r="2.5" {...stroke} />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1-4.5-4.2 6.1-.8L12 3Z" fill="currentColor" />
    </svg>
  );
}

export function HeartSolid({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M12 21s-8.5-5.2-8.5-11.6A4.9 4.9 0 0 1 12 6.4a4.9 4.9 0 0 1 8.5 3c0 6.4-8.5 11.6-8.5 11.6Z" fill="currentColor" />
    </svg>
  );
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M16.6 3c.3 2.2 1.6 3.7 3.9 3.9v3.1c-1.4.1-2.7-.3-3.9-1v6.3c0 3.6-2.9 5.7-5.8 5.7a5.6 5.6 0 0 1-5.6-5.6c0-3.5 3.1-6 6.6-5.5v3.2c-1.6-.4-3.4.6-3.4 2.4 0 1.4 1.1 2.4 2.4 2.4 1.5 0 2.6-1 2.6-2.8V3h3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Solid lemon used in the logo */
export function Lemon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <path d="M22 6c2-3 6-4 9-3-1 3-4 5-8 5" fill="#6b8e23" />
      <ellipse cx="19" cy="22" rx="14" ry="12" transform="rotate(-35 19 22)" fill="#f8d33a" stroke="#2a1f17" strokeWidth="2" />
      <path d="M11 26c1 3 4 5 7 5" stroke="#fff6c4" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function CupcakeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M8 17h16l-2 11H10L8 17Z" {...stroke} />
      <path d="M12 17l1 11M16 17v11M20 17l-1 11" {...stroke} />
      <path d="M7 17c-1-4 2-6 4-6 0-3 3-5 5-5s5 2 5 5c2 0 5 2 4 6H7Z" {...stroke} />
      <circle cx="16" cy="4" r="1.5" {...stroke} />
    </svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 4c1 6 3 8 9 9-6 1-8 3-9 9-1-6-3-8-9-9 6-1 8-3 9-9Z" {...stroke} />
      <path d="M25 21c.5 2.5 1.5 3.5 4 4-2.5.5-3.5 1.5-4 4-.5-2.5-1.5-3.5-4-4 2.5-.5 3.5-1.5 4-4Z" {...stroke} />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="12" {...stroke} />
      <path d="M16 9v7l5 3" {...stroke} />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" {...stroke} strokeWidth={2} />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M12 2a10 10 0 0 0-1.6 19.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Line-art strawberry like the icons in the mockup */
export function StrawberryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 29c-6.5-3-10.5-9-10.5-14.2C5.5 11 8.6 9 12 9.6c1.6.3 2.8.9 4 .9s2.4-.6 4-.9c3.4-.6 6.5 1.4 6.5 5.2C26.5 20 22.5 26 16 29Z" {...stroke} />
      <path d="M11 9.5 9 6.5l4.2.8L16 4l2.8 3.3 4.2-.8-2 3" {...stroke} />
      <path d="M12 15h.01M16 14h.01M20 15h.01M13.5 19h.01M18.5 19h.01M16 23h.01" {...stroke} strokeWidth={2.4} />
    </svg>
  );
}

export function LeafIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 29V13M16 21l-4.5-4M16 17l4-4" {...stroke} />
      <path d="M16 3c5 4 7.5 8.5 7.5 13.5 0 4.5-3.4 8-7.5 8s-7.5-3.5-7.5-8C8.5 11.5 11 7 16 3Z" {...stroke} />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" {...stroke} />
      <path d="M3.5 10h17M8 3v4M16 3v4" {...stroke} />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5M14 11v5" {...stroke} />
    </svg>
  );
}

export function MessageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" {...stroke} strokeWidth={2} />
      <path d="m4 7 8 6 8-6" {...stroke} strokeWidth={2} />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" {...stroke} strokeWidth={2} />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...stroke} strokeWidth={2} />
    </svg>
  );
}

export function AppleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.3-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.5.9-1.4 1.3-2.7 1.3-2.8 0 0-2.6-1-2.6-4.1ZM13.9 4.9c.7-.8 1.2-2 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4Z"
        fill="currentColor"
      />
    </svg>
  );
}
