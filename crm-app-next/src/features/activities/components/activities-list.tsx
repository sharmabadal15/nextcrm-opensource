"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  Utensils,
  Video,
  ClipboardList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ActivityFormDialog } from "./activity-form-dialog";
import {
  useActivities,
  useCreateActivity,
  useUpdateActivity,
  useToggleActivity,
  useDeleteActivity,
} from "../hooks/use-activities";
import type { ActivityFormValues } from "../schemas/activity-schema";
import { useUsersList } from "@/hooks/use-users";
import { useContacts } from "@/features/contacts/hooks/use-contacts";
import type { Activity, ActivityType, Priority } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Video,
  task: ClipboardList,
  note: MessageSquare,
  lunch: Utensils,
};

const TYPE_COLORS: Record<ActivityType, string> = {
  call: "text-blue-500",
  email: "text-purple-500",
  meeting: "text-orange-500",
  task: "text-green-500",
  note: "text-slate-500",
  lunch: "text-amber-500",
};

const PRIORITY_VARIANTS: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  high: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
  urgent: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
};

const TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "call", label: "Calls" },
  { value: "email", label: "Emails" },
  { value: "meeting", label: "Meetings" },
  { value: "task", label: "Tasks" },
  { value: "note", label: "Notes" },
  { value: "lunch", label: "Lunch" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ActivitiesList() {
  const router = useRouter();
  const { data: users } = useUsersList();
  const { data: contactsData } = useContacts({ page: 1, perPage: 100 });
  const contacts = contactsData?.data ?? [];
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteActivity, setDeleteActivity] = useState<Activity | null>(null);

  const createMutation = useCreateActivity();
  const updateMutation = useUpdateActivity();
  const toggleMutation = useToggleActivity();
  const deleteMutation = useDeleteActivity();

  const params = useMemo(
    () => ({
      page,
      perPage: 20,
      search: search || undefined,
      filters: {
        ...(typeFilter !== "all" ? { type: typeFilter } : {}),
        ...(statusFilter === "pending" ? { isCompleted: false } : {}),
        ...(statusFilter === "completed" ? { isCompleted: true } : {}),
      },
      sort: { field: "createdAt" as const, direction: "desc" as const },
    }),
    [page, search, typeFilter, statusFilter]
  );

  const { data, isLoading } = useActivities(params);
  const activities = data?.data ?? [];
  const meta = data?.meta;

  const handleCreate = (values: ActivityFormValues) => {
    createMutation.mutate(values as Omit<Activity, "id" | "createdAt" | "updatedAt">, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const handleUpdate = (values: ActivityFormValues) => {
    if (!editActivity) return;
    updateMutation.mutate(
      { id: editActivity.id, data: values },
      { onSuccess: () => setEditActivity(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteActivity) return;
    deleteMutation.mutate(deleteActivity.id, {
      onSuccess: () => setDeleteActivity(null),
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <Filter className="mr-1.5 size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 size-3.5" />
          Log Activity
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="py-16 text-center">
          <ClipboardList className="mx-auto size-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">No activities found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || typeFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "Log your first activity to get started."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => {
            const Icon = TYPE_ICONS[activity.type];
            const owner = users.find((u) => u.id === activity.ownerId);
            const contact = activity.contactId
              ? contacts.find((c) => c.id === activity.contactId)
              : null;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                {/* Toggle complete */}
                <button
                  type="button"
                  className="mt-0.5 shrink-0"
                  onClick={() => toggleMutation.mutate(activity.id)}
                >
                  {activity.isCompleted ? (
                    <CheckCircle2 className="size-5 text-green-500" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground hover:text-foreground" />
                  )}
                </button>

                {/* Icon */}
                <div className={`mt-0.5 shrink-0 ${TYPE_COLORS[activity.type]}`}>
                  <Icon className="size-4" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          activity.isCompleted
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {activity.subject}
                      </p>
                      {activity.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setEditActivity(activity)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => setDeleteActivity(activity)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="secondary"
                      className="capitalize text-[10px] px-1.5 py-0"
                    >
                      {activity.type}
                    </Badge>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_VARIANTS[activity.priority]}`}>
                      {activity.priority}
                    </span>
                    {activity.dueDate && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="size-3" />
                        {format(new Date(activity.dueDate), "MMM d")}
                      </span>
                    )}
                    {contact && (
                      <span className="text-muted-foreground">
                        → {contact.firstName} {contact.lastName}
                      </span>
                    )}
                    {owner && (
                      <Avatar className="size-5">
                        <AvatarImage src={owner.avatar} />
                        <AvatarFallback className="text-[8px]">
                          {owner.firstName[0]}
                          {owner.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span className="ml-auto text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {(meta.page - 1) * meta.perPage + 1}–
            {Math.min(meta.page * meta.perPage, meta.total)} of {meta.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ActivityFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isLoading={createMutation.isPending}
        onSubmit={handleCreate}
      />

      {editActivity && (
        <ActivityFormDialog
          open={!!editActivity}
          onOpenChange={(open) => !open && setEditActivity(null)}
          activity={editActivity}
          isLoading={updateMutation.isPending}
          onSubmit={handleUpdate}
        />
      )}

      <ConfirmDialog
        open={!!deleteActivity}
        onOpenChange={(open) => !open && setDeleteActivity(null)}
        title="Delete Activity"
        description={`Delete "${deleteActivity?.subject}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
