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
import {
  DataTable,
  getSelectColumn,
} from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DealFormDialog } from "./deal-form-dialog";
import { getDealColumns } from "./deals-columns";
import {
  useDeals,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
} from "../hooks/use-deals";
import { useDefaultPipeline } from "../hooks/use-pipelines";
import { useUsersList } from "@/hooks/use-users";
import type { Deal, SearchParams } from "@/types";
import type { DealFormValues } from "../schemas/deal-schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PER_PAGE = 10;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DealsListTable() {
  const { data: pipeline } = useDefaultPipeline();
  const { data: users } = useUsersList();
  const OWNER_FILTERS = useMemo(
    () => [
      { value: "all", label: "All Owners" },
      ...users.map((u) => ({ value: u.id, label: `${u.firstName} ${u.lastName}` })),
    ],
    [users]
  );
  const STAGE_FILTERS = [
    { value: "all", label: "All Stages" },
    ...(pipeline?.stages ?? []).map((s) => ({ value: s.id, label: s.name })),
  ];
  const router = useRouter();
  const [, startTransition] = useTransition();

  // URL state
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [searchParam, setSearchParam] = useQueryState("q", parseAsString.withDefault(""));
  const [stageFilter, setStageFilter] = useQueryState("stage", parseAsString.withDefault("all"));
  const [ownerFilter, setOwnerFilter] = useQueryState("owner", parseAsString.withDefault("all"));

  // Local state
  const [search, setSearch] = useState(searchParam);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [deleteDeal, setDeleteDeal] = useState<Deal | null>(null);

  // Debounced search
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
    const params: SearchParams = { page, perPage: PER_PAGE };
    if (searchParam) params.search = searchParam;
    const filters: Record<string, string> = {};
    if (stageFilter !== "all") filters.stageId = stageFilter;
    if (ownerFilter !== "all") filters.ownerId = ownerFilter;
    if (Object.keys(filters).length > 0) params.filters = filters;
    if (sorting.length > 0) {
      params.sort = { field: sorting[0].id, direction: sorting[0].desc ? "desc" : "asc" };
    }
    return params;
  }, [page, searchParam, stageFilter, ownerFilter, sorting]);

  // Data
  const { data, isLoading } = useDeals(queryParams);
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();
  const deleteMutation = useDeleteDeal();

  // Columns
  const columns = useMemo(
    () => [
      getSelectColumn<Deal>(),
      ...getDealColumns({
        onEdit: (d) => setEditDeal(d),
        onDelete: (d) => setDeleteDeal(d),
        onView: (d) => router.push(`/deals/${d.id}`),
      }),
    ],
    [router]
  );

  // Handlers
  const handleCreate = (values: DealFormValues) => {
    createMutation.mutate(
      {
        ...values,
        status: "open",
        customFields: {},
        ownerId: values.ownerId || undefined,
        contactId: values.contactId || undefined,
        companyId: values.companyId || undefined,
        expectedCloseDate: values.expectedCloseDate || undefined,
      } as Omit<Deal, "id" | "createdAt" | "updatedAt">,
      { onSuccess: () => setCreateOpen(false) }
    );
  };

  const handleUpdate = (values: DealFormValues) => {
    if (!editDeal) return;
    updateMutation.mutate(
      { id: editDeal.id, data: values },
      { onSuccess: () => setEditDeal(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteDeal) return;
    deleteMutation.mutate(deleteDeal.id, {
      onSuccess: () => setDeleteDeal(null),
    });
  };

  // Bulk
  const selectedDeals = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((_, i) => rowSelection[i]);
  }, [data, rowSelection]);
  const selectedCount = Object.keys(rowSelection).length;

  const handleBulkExport = () => {
    const rows = selectedDeals.length > 0 ? selectedDeals : (data?.data ?? []);
    const headers = ["Title", "Value", "Currency", "Stage", "Company", "Contact", "Owner", "Probability", "Expected Close"];
    const csv = [
      headers.join(","),
      ...rows.map((d) =>
        [d.title, d.value, d.currency, d.stage?.name ?? "", d.company?.name ?? "", d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : "", d.ownerId, d.probability, d.expectedCloseDate ?? ""]
          .map((v) => `"${v}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deals-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} deal(s)`);
  };

  // Filter labels
  const stageLabel = STAGE_FILTERS.find((o) => o.value === stageFilter)?.label ?? "All Stages";
  const ownerLabel = OWNER_FILTERS.find((o) => o.value === ownerFilter)?.label ?? "All Owners";

  const activeFilterCount =
    (stageFilter !== "all" ? 1 : 0) +
    (ownerFilter !== "all" ? 1 : 0) +
    (searchParam ? 1 : 0);

  const clearFilters = () => {
    startTransition(() => {
      setSearch("");
      setSearchParam(null);
      setStageFilter(null);
      setOwnerFilter(null);
      setPage(1);
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search deals..."
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

          <Select
            value={stageFilter}
            onValueChange={(val) => startTransition(() => { setStageFilter(val ?? "all"); setPage(1); })}
          >
            <SelectTrigger className="w-auto min-w-32">
              <SelectValue>{stageLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {STAGE_FILTERS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={ownerFilter}
            onValueChange={(val) => startTransition(() => { setOwnerFilter(val ?? "all"); setPage(1); })}
          >
            <SelectTrigger className="w-auto min-w-32">
              <SelectValue>{ownerLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {OWNER_FILTERS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Badge variant="secondary" className="gap-1">
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                <X className="size-3" />
              </Badge>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBulkExport}>
            <Download className="mr-1.5 size-4" />
            Export
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            Add Deal
          </Button>
        </div>
      </div>

      {/* Bulk bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <Button variant="ghost" size="sm" onClick={handleBulkExport}>
            <Download className="mr-1 size-3.5" />
            Export
          </Button>
          <button type="button" className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setRowSelection({})}>
            Clear selection
          </button>
        </div>
      )}

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
        onRowClick={(deal) => router.push(`/deals/${deal.id}`)}
      />

      <DealFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isLoading={createMutation.isPending}
        onSubmit={handleCreate}
      />
      <DealFormDialog
        open={!!editDeal}
        onOpenChange={(open) => !open && setEditDeal(null)}
        deal={editDeal}
        isLoading={updateMutation.isPending}
        onSubmit={handleUpdate}
      />
      <ConfirmDialog
        open={!!deleteDeal}
        onOpenChange={(open) => !open && setDeleteDeal(null)}
        title="Delete Deal"
        description={`Are you sure you want to delete "${deleteDeal?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
