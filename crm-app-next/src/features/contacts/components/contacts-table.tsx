"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { Download, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { type SortingState, type RowSelectionState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DataTable,
  getSelectColumn,
} from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ContactFormDialog } from "./contact-form-dialog";
import { getContactColumns } from "./contacts-columns";
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from "../hooks/use-contacts";
import { useUsersList } from "@/hooks/use-users";
import type { Contact, ContactStatus, LeadSource, SearchParams } from "@/types";
import type { ContactFormValues } from "../schemas/contact-schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_FILTERS: { value: ContactStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "customer", label: "Customer" },
  { value: "inactive", label: "Inactive" },
];

const SOURCE_FILTERS: { value: LeadSource | "all"; label: string }[] = [
  { value: "all", label: "All Sources" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "cold_call", label: "Cold Call" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

const PER_PAGE = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactsTable() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { data: users } = useUsersList();
  const OWNER_FILTERS = useMemo(
    () => [
      { value: "all", label: "All Owners" },
      ...users.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
    ],
    [users]
  );

  // URL-driven state via nuqs
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [searchParam, setSearchParam] = useQueryState("q", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString.withDefault("all"));
  const [sourceFilter, setSourceFilter] = useQueryState("source", parseAsString.withDefault("all"));
  const [ownerFilter, setOwnerFilter] = useQueryState("owner", parseAsString.withDefault("all"));

  // Local state
  const [search, setSearch] = useState(searchParam);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  // Debounced search → URL
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        startTransition(() => {
          setSearchParam(value || null);
          setPage(1);
        });
      }, 300);
      setDebounceTimer(timer);
    },
    [debounceTimer, setSearchParam, setPage]
  );

  // Query params
  const queryParams = useMemo<SearchParams>(() => {
    const params: SearchParams = {
      page,
      perPage: PER_PAGE,
    };
    if (searchParam) params.search = searchParam;
    const filters: Record<string, string> = {};
    if (statusFilter !== "all") filters.status = statusFilter;
    if (sourceFilter !== "all") filters.source = sourceFilter;
    if (ownerFilter !== "all") filters.ownerId = ownerFilter;
    if (Object.keys(filters).length > 0) params.filters = filters;
    if (sorting.length > 0) {
      params.sort = {
        field: sorting[0].id,
        direction: sorting[0].desc ? "desc" : "asc",
      };
    }
    return params;
  }, [page, searchParam, statusFilter, sourceFilter, ownerFilter, sorting]);

  // Data
  const { data, isLoading } = useContacts(queryParams);
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  // Column defs
  const columns = useMemo(
    () => [
      getSelectColumn<Contact>(),
      ...getContactColumns({
        onEdit: (c) => setEditContact(c),
        onDelete: (c) => setDeleteContact(c),
      }),
    ],
    []
  );

  // Handlers
  const handleCreate = (values: ContactFormValues) => {
    createMutation.mutate(
      {
        ...values,
        phone: values.phone || undefined,
        title: values.title || undefined,
        companyId: values.companyId || undefined,
        customFields: {},
        address: undefined,
        socialProfiles: undefined,
        lastContactedAt: undefined,
      } as Omit<Contact, "id" | "createdAt" | "updatedAt">,
      {
        onSuccess: () => setCreateOpen(false),
      }
    );
  };

  const handleUpdate = (values: ContactFormValues) => {
    if (!editContact) return;
    updateMutation.mutate(
      { id: editContact.id, data: values },
      { onSuccess: () => setEditContact(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteContact) return;
    deleteMutation.mutate(deleteContact.id, {
      onSuccess: () => setDeleteContact(null),
    });
  };

  const handleRowClick = (contact: Contact) => {
    router.push(`/contacts/${contact.id}`);
  };

  // --- Bulk actions ---
  const selectedIds = Object.keys(rowSelection);
  const selectedCount = selectedIds.length;
  const selectedContacts = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((_, i) => rowSelection[i]);
  }, [data, rowSelection]);

  const handleBulkDelete = () => {
    const ids = selectedContacts.map((c) => c.id);
    let completed = 0;
    ids.forEach((id) => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          completed++;
          if (completed === ids.length) {
            setRowSelection({});
            toast.success(`Deleted ${ids.length} contact(s)`);
          }
        },
      });
    });
  };

  const handleBulkExport = () => {
    const rows = selectedContacts.length > 0 ? selectedContacts : (data?.data ?? []);
    const headers = ["First Name", "Last Name", "Email", "Phone", "Status", "Company", "Owner"];
    const csv = [
      headers.join(","),
      ...rows.map((c) =>
        [
          c.firstName,
          c.lastName,
          c.email,
          c.phone ?? "",
          c.status,
          c.company?.name ?? "",
          c.owner ? `${c.owner.firstName} ${c.owner.lastName}` : "",
        ]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} contact(s)`);
  };

  // Filter counts
  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (sourceFilter !== "all" ? 1 : 0) +
    (ownerFilter !== "all" ? 1 : 0) +
    (searchParam ? 1 : 0);

  const clearFilters = () => {
    startTransition(() => {
      setSearch("");
      setSearchParam(null);
      setStatusFilter(null);
      setSourceFilter(null);
      setOwnerFilter(null);
      setPage(1);
    });
  };

  // Lookup labels for select display
  const statusLabel = STATUS_FILTERS.find((o) => o.value === statusFilter)?.label ?? "All Statuses";
  const sourceLabel = SOURCE_FILTERS.find((o) => o.value === sourceFilter)?.label ?? "All Sources";
  const ownerLabel = OWNER_FILTERS.find((o) => o.value === ownerFilter)?.label ?? "All Owners";

  return (
    <div className="space-y-4">
      {/* Toolbar wrapper — bulk bar overlays on top */}
      <div className="relative">

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => startTransition(() => { setStatusFilter(val ?? "all"); setPage(1); })}
          >
            <SelectTrigger className="w-auto min-w-32">
              <SelectValue>{statusLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Source filter */}
          <Select
            value={sourceFilter}
            onValueChange={(val) => startTransition(() => { setSourceFilter(val ?? "all"); setPage(1); })}
          >
            <SelectTrigger className="w-auto min-w-32">
              <SelectValue>{sourceLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SOURCE_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Owner filter */}
          <Select
            value={ownerFilter}
            onValueChange={(val) => startTransition(() => { setOwnerFilter(val ?? "all"); setPage(1); })}
          >
            <SelectTrigger className="w-auto min-w-32">
              <SelectValue>{ownerLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {OWNER_FILTERS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Active filter badge + clear */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Badge variant="secondary" className="gap-1">
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                <X className="size-3" />
              </Badge>
            </button>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="mr-1.5 size-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Bulk action bar — absolute overlay on toolbar */}
      {selectedCount > 0 && (
        <div className="absolute inset-0 z-10 flex items-center gap-3 rounded-lg border bg-background px-4">
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-1 size-3.5" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBulkExport}
            >
              <Download className="mr-1 size-3.5" />
              Export
            </Button>
          </div>
          <button
            type="button"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setRowSelection({})}
          >
            Clear selection
          </button>
        </div>
      )}

      </div>{/* end toolbar wrapper */}

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        sorting={sorting}
        onSortingChange={setSorting}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        page={page}
        perPage={PER_PAGE}
        pageCount={data?.meta.totalPages}
        total={data?.meta.total}
        onPageChange={(p) => { startTransition(() => { setPage(p); }); }}
        onRowClick={handleRowClick}
      />

      {/* Create dialog */}
      <ContactFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isLoading={createMutation.isPending}
        onSubmit={handleCreate}
      />

      {/* Edit dialog */}
      <ContactFormDialog
        open={!!editContact}
        onOpenChange={(open) => !open && setEditContact(null)}
        contact={editContact}
        isLoading={updateMutation.isPending}
        onSubmit={handleUpdate}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteContact}
        onOpenChange={(open) => !open && setDeleteContact(null)}
        title="Delete Contact"
        description={`Are you sure you want to delete ${deleteContact?.firstName} ${deleteContact?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
