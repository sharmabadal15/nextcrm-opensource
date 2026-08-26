"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calendar,
  Handshake,
  LayoutDashboard,
  ListTodo,
  Plus,
  Settings,
  Users,
  BarChart3,
  User,
} from "lucide-react";

import { useUIStore } from "@/stores/ui-store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useContacts } from "@/features/contacts/hooks/use-contacts";
import { useCompanies } from "@/features/companies/hooks/use-companies";
import { useDeals } from "@/features/deals/hooks/use-deals";

const navigationItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Deals", href: "/deals", icon: Handshake },
  { label: "Activities", href: "/activities", icon: ListTodo },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { label: "New Contact", href: "/contacts?action=new", icon: Plus },
  { label: "New Company", href: "/companies?action=new", icon: Plus },
  { label: "New Deal", href: "/deals?action=new", icon: Plus },
];

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  // Fetch entity data for search
  const { data: contactsData } = useContacts({ page: 1, perPage: 100 });
  const { data: companiesData } = useCompanies({ page: 1, perPage: 100 });
  const { data: dealsData } = useDeals({ page: 1, perPage: 100 });
  const allContacts = contactsData?.data ?? [];
  const allCompanies = companiesData?.data ?? [];
  const allDeals = dealsData?.data ?? [];

  // Search across entities
  const filteredContacts = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return allContacts
      .filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [search, allContacts]);

  const filteredCompanies = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return allCompanies
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [search, allCompanies]);

  const filteredDeals = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return allDeals
      .filter((d) => d.title.toLowerCase().includes(q))
      .slice(0, 5);
  }, [search, allDeals]);

  const hasResults =
    filteredContacts.length > 0 ||
    filteredCompanies.length > 0 ||
    filteredDeals.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search contacts, companies, deals..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Entity search results */}
        {search && hasResults && (
          <>
            {filteredContacts.length > 0 && (
              <CommandGroup heading="Contacts">
                {filteredContacts.map((c) => (
                  <CommandItem
                    key={c.id}
                    onSelect={() => handleSelect(`/contacts/${c.id}`)}
                  >
                    <User className="mr-2 size-4 text-blue-500" />
                    <span>
                      {c.firstName} {c.lastName}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {c.email}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredCompanies.length > 0 && (
              <CommandGroup heading="Companies">
                {filteredCompanies.map((c) => (
                  <CommandItem
                    key={c.id}
                    onSelect={() => handleSelect(`/companies/${c.id}`)}
                  >
                    <Building2 className="mr-2 size-4 text-purple-500" />
                    <span>{c.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {c.industry}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredDeals.length > 0 && (
              <CommandGroup heading="Deals">
                {filteredDeals.map((d) => (
                  <CommandItem
                    key={d.id}
                    onSelect={() => handleSelect(`/deals/${d.id}`)}
                  >
                    <Handshake className="mr-2 size-4 text-green-500" />
                    <span>{d.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      ${d.value.toLocaleString()}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Quick Actions">
          {quickActions.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon className="mr-2 size-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => handleSelect(item.href)}
            >
              <item.icon className="mr-2 size-4" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
