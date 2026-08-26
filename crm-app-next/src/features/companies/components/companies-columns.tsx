"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Company, User } from "@/types";

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

interface ColumnActions {
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
  onView: (company: Company) => void;
  users?: User[];
}

export function getCompanyColumns({
  onEdit,
  onDelete,
  onView,
  users = [],
}: ColumnActions): ColumnDef<Company>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Company
          <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={company.logo} alt={company.name} />
              <AvatarFallback className="text-xs">
                {company.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium">{company.name}</span>
              {company.domain && (
                <p className="text-xs text-muted-foreground">{company.domain}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "industry",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Industry
          <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => row.original.industry ?? "—",
    },
    {
      accessorKey: "employeeCount",
      header: "Size",
      cell: ({ row }) => {
        const size = row.original.employeeCount;
        return size ? (
          <Badge variant="outline" className="text-xs">
            {size}
          </Badge>
        ) : (
          "—"
        );
      },
    },
    {
      id: "contactsCount",
      header: "Contacts",
      cell: ({ row }) => row.original.contactIds.length,
    },
    {
      id: "dealsCount",
      header: "Deals",
      cell: ({ row }) => row.original.dealIds.length,
    },
    {
      accessorKey: "ownerId",
      header: "Owner",
      cell: ({ row }) => {
        const owner = users.find((u) => u.id === row.original.ownerId);
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
            <span className="truncate text-sm">{owner.firstName} {owner.lastName}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const company = row.original;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-muted">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onView(company)}>
                <Eye className="mr-2 size-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(company)}>
                <Edit className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(company)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
