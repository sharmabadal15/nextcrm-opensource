import type { UserRole } from "@/types";

export const PERMISSIONS = {
  "contacts.view": ["admin", "manager", "sales_rep", "viewer"],
  "contacts.create": ["admin", "manager", "sales_rep"],
  "contacts.edit": ["admin", "manager", "sales_rep"],
  "contacts.delete": ["admin", "manager"],
  "contacts.export": ["admin", "manager", "sales_rep"],
  "contacts.import": ["admin", "manager"],

  "companies.view": ["admin", "manager", "sales_rep", "viewer"],
  "companies.create": ["admin", "manager", "sales_rep"],
  "companies.edit": ["admin", "manager", "sales_rep"],
  "companies.delete": ["admin", "manager"],

  "deals.view": ["admin", "manager", "sales_rep", "viewer"],
  "deals.create": ["admin", "manager", "sales_rep"],
  "deals.edit": ["admin", "manager", "sales_rep"],
  "deals.delete": ["admin", "manager"],

  "activities.view": ["admin", "manager", "sales_rep", "viewer"],
  "activities.create": ["admin", "manager", "sales_rep"],
  "activities.edit": ["admin", "manager", "sales_rep"],
  "activities.delete": ["admin", "manager"],

  "reports.view": ["admin", "manager", "sales_rep", "viewer"],
  "reports.export": ["admin", "manager"],

  "settings.view": ["admin", "manager"],
  "settings.edit": ["admin"],
  "settings.team": ["admin"],
  "settings.roles": ["admin"],
  "settings.billing": ["admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(role);
}
