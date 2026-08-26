"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const ROLES = ["Admin", "Manager", "Sales Rep", "Viewer"];

const PERMISSIONS = [
  {
    group: "Contacts",
    items: [
      { label: "View contacts", admin: true, manager: true, sales_rep: true, viewer: true },
      { label: "Create contacts", admin: true, manager: true, sales_rep: true, viewer: false },
      { label: "Edit contacts", admin: true, manager: true, sales_rep: true, viewer: false },
      { label: "Delete contacts", admin: true, manager: true, sales_rep: false, viewer: false },
      { label: "Export contacts", admin: true, manager: true, sales_rep: false, viewer: false },
    ],
  },
  {
    group: "Companies",
    items: [
      { label: "View companies", admin: true, manager: true, sales_rep: true, viewer: true },
      { label: "Create companies", admin: true, manager: true, sales_rep: true, viewer: false },
      { label: "Edit companies", admin: true, manager: true, sales_rep: true, viewer: false },
      { label: "Delete companies", admin: true, manager: true, sales_rep: false, viewer: false },
    ],
  },
  {
    group: "Deals",
    items: [
      { label: "View deals", admin: true, manager: true, sales_rep: true, viewer: true },
      { label: "Create deals", admin: true, manager: true, sales_rep: true, viewer: false },
      { label: "Edit deals", admin: true, manager: true, sales_rep: true, viewer: false },
      { label: "Delete deals", admin: true, manager: true, sales_rep: false, viewer: false },
      { label: "Move deals in pipeline", admin: true, manager: true, sales_rep: true, viewer: false },
    ],
  },
  {
    group: "Reports",
    items: [
      { label: "View reports", admin: true, manager: true, sales_rep: true, viewer: true },
      { label: "Export reports", admin: true, manager: true, sales_rep: false, viewer: false },
    ],
  },
  {
    group: "Settings",
    items: [
      { label: "View settings", admin: true, manager: true, sales_rep: false, viewer: false },
      { label: "Manage team", admin: true, manager: false, sales_rep: false, viewer: false },
      { label: "Manage roles", admin: true, manager: false, sales_rep: false, viewer: false },
      { label: "Manage pipelines", admin: true, manager: true, sales_rep: false, viewer: false },
      { label: "Manage integrations", admin: true, manager: false, sales_rep: false, viewer: false },
    ],
  },
];

const ROLE_KEYS = ["admin", "manager", "sales_rep", "viewer"] as const;

export default function RolesSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">Roles & Permissions</h3>
        <p className="text-sm text-muted-foreground">
          View and manage permission levels for each role
        </p>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[240px]">
                Permission
              </th>
              {ROLES.map((role) => (
                <th key={role} className="px-4 py-3 text-center font-medium">
                  <Badge variant="secondary" className="capitalize text-xs">
                    {role}
                  </Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map((group) => (
              <React.Fragment key={group.group}>
                <tr className="bg-muted/30">
                  <td colSpan={5} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.group}
                  </td>
                </tr>
                {group.items.map((perm) => (
                  <tr key={perm.label} className="border-b last:border-0">
                    <td className="px-4 py-2.5 text-sm">{perm.label}</td>
                    {ROLE_KEYS.map((role) => (
                      <td key={role} className="px-4 py-2.5 text-center">
                        <Checkbox
                          checked={perm[role]}
                          disabled
                          className="mx-auto"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Custom role creation will be available when the backend is connected.
        Currently showing the default permission matrix.
      </p>
    </div>
  );
}
