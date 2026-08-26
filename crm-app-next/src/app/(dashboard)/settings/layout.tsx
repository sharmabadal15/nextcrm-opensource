"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Database,
  GitBranch,
  KeyRound,
  LayoutGrid,
  Bell,
  User,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
  { href: "/settings", label: "Profile", icon: User },
  { href: "/settings/team", label: "Team", icon: Users },
  { href: "/settings/roles", label: "Roles & Permissions", icon: KeyRound },
  { href: "/settings/pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/settings/integrations", label: "Integrations", icon: LayoutGrid },
  { href: "/settings/organization", label: "Organization", icon: Building2 },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/data", label: "Data Management", icon: Database },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account and organization settings"
      />
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar nav */}
        <nav className="lg:w-56 shrink-0">
          <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/settings" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <Separator orientation="vertical" className="hidden lg:block h-auto" />

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
