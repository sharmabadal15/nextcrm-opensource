"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CURRENCIES } from "@/config/pipeline";
import type { Deal } from "@/types";

// ---------------------------------------------------------------------------
// Column actions
// ---------------------------------------------------------------------------

interface ColumnActions {
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onView: (deal: Deal) => void;
}

export function getDealColumns({
  onEdit,
  onDelete,
  onView,
}: ColumnActions): ColumnDef<Deal>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Deal
          <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium line-clamp-1">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "value",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Value
          <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const deal = row.original;
        const sym = CURRENCIES.find((c) => c.value === deal.currency)?.symbol ?? "$";
        return (
          <span className="font-semibold text-primary">
            {sym}
            {new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(deal.value)}
          </span>
        );
      },
    },
    {
      id: "stage",
      header: "Stage",
      cell: ({ row }) => {
        const stage = row.original.stage;
        if (!stage) return "—";
        return (
          <div className="flex items-center gap-1.5">
            <div
              className="size-2 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            <span className="text-sm">{stage.name}</span>
          </div>
        );
      },
    },
    {
      id: "company",
      header: "Company",
      cell: ({ row }) => row.original.company?.name ?? "—",
    },
    {
      id: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const c = row.original.contact;
        if (!c) return "—";
        return `${c.firstName} ${c.lastName}`;
      },
    },
    {
      id: "owner",
      header: "Owner",
      cell: ({ row }) => {
        const o = row.original.owner;
        if (!o) return "—";
        return (
          <div className="flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarImage src={o.avatar} />
              <AvatarFallback className="text-[9px]">
                {o.firstName[0]}
                {o.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{o.firstName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "expectedCloseDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Close Date
          <ArrowUpDown className="ml-1.5 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = row.original.expectedCloseDate;
        return d ? format(new Date(d), "MMM d, yyyy") : "—";
      },
    },
    {
      accessorKey: "probability",
      header: "Prob.",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.probability}%
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const deal = row.original;
        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-muted">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Open menu</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onView(deal)}>
                  <Eye className="mr-2 size-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(deal)}>
                  <Edit className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(deal)}
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
