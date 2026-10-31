// The dashboard's sections, shared by the sidebar (browser) and pages (server)
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
  { href: "/admin/locations", label: "Locations", icon: PinIcon },
  { href: "/admin/website", label: "Edit Website", icon: ImageIcon },
  { href: "/admin/promotions", label: "Promotions", icon: MegaphoneIcon },
  { href: "/admin/customers", label: "Customers", icon: UsersIcon },
  { href: "/admin/analytics", label: "Analytics", icon: ChartIcon },
  { href: "/admin/settings", label: "Settings", icon: GearIcon },
];
