// The dashboard's sections, shared by the sidebar (browser) and pages (server).
// `ownerOnly` ones are for the site manager's login, not R&X's staff login.
import {
  ChartIcon,
  DashboardIcon,
  GearIcon,
  ImageIcon,
  MegaphoneIcon,
  MenuBookIcon,
  OrdersIcon,
  PinIcon,
  UsersIcon,
} from "@/components/admin/icons";

export const adminNav = [
  { href: "/admin", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/orders", label: "Orders", icon: OrdersIcon },
  { href: "/admin/menu", label: "Menu", icon: MenuBookIcon },
  { href: "/admin/locations", label: "Locations", icon: PinIcon, ownerOnly: true },
  { href: "/admin/website", label: "Edit Website", icon: ImageIcon, ownerOnly: true },
  { href: "/admin/promotions", label: "Promotions", icon: MegaphoneIcon, ownerOnly: true },
  { href: "/admin/customers", label: "Customers", icon: UsersIcon },
  { href: "/admin/analytics", label: "Analytics", icon: ChartIcon },
  { href: "/admin/settings", label: "Settings", icon: GearIcon },
];
