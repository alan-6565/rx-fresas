// Line icons for the staff dashboard, drawn to match the mockup's sidebar.
type P = { className?: string };
const s = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const DashboardIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
export const OrdersIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <rect x="5" y="4" width="14" height="17" rx="2" />
    <path d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4" />
  </svg>
);
export const MenuBookIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4 5.5C6.5 4 9.5 4 12 5.5v14C9.5 18 6.5 18 4 19.5v-14ZM20 5.5C17.5 4 14.5 4 12 5.5v14c2.5-1.5 5.5-1.5 8 0v-14Z" />
  </svg>
);
export const PinIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 21s7-6.6 7-11.5A7 7 0 0 0 5 9.5C5 14.4 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const ImageIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17 5-4.5 3.5 3 3-2.5L20 17" />
  </svg>
);
export const MegaphoneIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4 10v4h3l8 4.5v-13L7 10H4ZM18 9.5a3.5 3.5 0 0 1 0 5M7 14l1.5 5h2.5L10 15" />
  </svg>
);
export const UsersIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5M16 5.6a3 3 0 0 1 0 5.8M18 14.7c1.6.7 2.7 2.4 3 4.8" />
  </svg>
);
export const ChartIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4 20h16M7 16v-4M11 16V8M15 16v-6M19 16V5" />
  </svg>
);
export const GearIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);
export const BagIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M5 8h14l-1 12.5H6L5 8Z" />
    <path d="M9 10V6.5a3 3 0 0 1 6 0V10" />
  </svg>
);
export const TrendIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4 20h16M6 16v-3M10 16v-6M14 16v-4M18 16V8M4 11l5-5 4 3 7-6M16 3h4v4" />
  </svg>
);
export const ClockIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
export const HeartIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11Z" />
  </svg>
);
export const CartIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M3 4h2.5l2.2 11h10.6L20.5 7H6.4" />
    <circle cx="9" cy="19" r="1.4" />
    <circle cx="17" cy="19" r="1.4" />
  </svg>
);
export const CalendarEditIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4M10 17l.5-2 3.5-3.5 1.5 1.5-3.5 3.5-2 .5Z" />
  </svg>
);
export const SparkleIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 3c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6ZM18.5 15c.3 1.8 1 2.6 2.5 3-1.5.4-2.2 1.2-2.5 3-.3-1.8-1-2.6-2.5-3 1.5-.4 2.2-1.2 2.5-3Z" />
  </svg>
);
export const SearchIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);
export const BellIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" />
  </svg>
);
export const LogoutIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 8l-4 4 4 4M5 12h11" />
  </svg>
);
export const PhoneIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5C10.5 20.5 3.5 13.5 3.5 5.5A1.5 1.5 0 0 1 5 4Z" />
  </svg>
);
export const CloseIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const MenuIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const PlusIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const PencilIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
  </svg>
);
export const CameraIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...s}>
    <path d="M4 8h3l2-2.5h6L17 8h3v11H4V8Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);
export const HeartDoodle = ({ className }: P) => (
  <svg viewBox="0 0 40 40" className={className} fill="none">
    <path d="M20 34C12 27 5 21 6 13.5 7 8 13.5 6.5 17 10.5c1.3 1.4 2.2 3 3 4.7.9-2 2-3.8 3.6-5.2C27.4 6.6 33.6 8 34.4 13.5 35.4 21 27.5 27.5 20 34Z" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
