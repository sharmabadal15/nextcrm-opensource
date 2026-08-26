"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Mail, Phone } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { SortableHeader } from "@/components/shared/data-table";
import type { Contact } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ColumnsOptions {
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

export function getContactColumns({
  onEdit,
  onDelete,
}: ColumnsOptions): ColumnDef<Contact, unknown>[] {
  return [
    // Name + Avatar
    {
      accessorKey: "firstName",
      header: ({ column }) => (
        <SortableHeader column={column}>Name</SortableHeader>
      ),
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={contact.avatar} alt={`${contact.firstName} ${contact.lastName}`} />
              <AvatarFallback className="text-xs">
                {contact.firstName[0]}
                {contact.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">
                {contact.firstName} {contact.lastName}
              </p>
              {contact.title && (
                <p className="truncate text-xs text-muted-foreground">
                  {contact.title}
                </p>
              )}
            </div>
          </div>
        );
      },
      size: 250,
    },

    // Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortableHeader column={column}>Email</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{row.original.email}</span>
        </div>
      ),
      size: 240,
    },

    // Company
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => (
        <span className="truncate text-muted-foreground">
          {row.original.company?.name ?? "—"}
        </span>
      ),
      size: 180,
    },

    // Status
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader column={column}>Status</SortableHeader>
      ),
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      size: 120,
    },

    // Owner
    {
      accessorKey: "owner",
      header: "Owner",
      cell: ({ row }) => {
        const owner = row.original.owner;
        if (!owner) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-5">
              <AvatarImage src={owner.avatar} alt={`${owner.firstName} ${owner.lastName}`} />
              <AvatarFallback className="text-[10px]">
                {owner.firstName[0]}
                {owner.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{owner.firstName}</span>
          </div>
        );
      },
      size: 140,
    },

    // Last Contacted
    {
      accessorKey: "lastContactedAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Last Contacted</SortableHeader>
      ),
      cell: ({ row }) => {
        const date = row.original.lastContactedAt;
        if (!date) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(date), { addSuffix: true })}
          </span>
        );
      },
      size: 160,
    },

    // Actions
    {
      id: "actions",
      cell: ({ row }) => {
        const contact = row.original;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-muted">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onEdit(contact)}>
                    Edit
                  </DropdownMenuItem>
                  {contact.email && (
                    <DropdownMenuItem
                      onClick={() => window.open(`mailto:${contact.email}`)}
                    >
                      <Mail className="size-4" />
                      Send Email
                    </DropdownMenuItem>
                  )}
                  {contact.phone && (
                    <DropdownMenuItem
                      onClick={() => window.open(`tel:${contact.phone}`)}
                    >
                      <Phone className="size-4" />
                      Call
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(contact)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      size: 60,
    },
  ];
}
