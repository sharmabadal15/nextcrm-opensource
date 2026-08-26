import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  ListTodo,
  Calendar,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavItem[];
}

export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: Users,
  },
  {
    title: "Companies",
    href: "/companies",
    icon: Building2,
  },
  {
    title: "Deals",
    href: "/deals",
    icon: Handshake,
  },
  {
    title: "Activities",
    href: "/activities",
    icon: ListTodo,
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
];

export const bottomNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
