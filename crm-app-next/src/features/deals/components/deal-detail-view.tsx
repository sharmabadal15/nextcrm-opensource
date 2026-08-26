"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Percent,
  Trash2,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { NotesPanel } from "@/components/shared/notes-panel";
import { FilesPanel } from "@/components/shared/files-panel";
import { DealFormDialog } from "./deal-form-dialog";
import {
  useDeal,
  useUpdateDeal,
  useDeleteDeal,
} from "../hooks/use-deals";
import { CURRENCIES } from "@/config/pipeline";
import { useDefaultPipeline } from "../hooks/use-pipelines";
import type { DealFormValues } from "../schemas/deal-schema";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DealDetailView({ dealId }: { dealId: string }) {
  const router = useRouter();
  const { data: deal, isLoading } = useDeal(dealId);
  const updateMutation = useUpdateDeal();
  const deleteMutation = useDeleteDeal();
  const { data: pipeline } = useDefaultPipeline();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <DealDetailSkeleton />;

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <DollarSign className="size-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Deal not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This deal may have been deleted.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/deals")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Deals
        </Button>
      </div>
    );
  }

  const handleUpdate = (values: DealFormValues) => {
    updateMutation.mutate(
      { id: deal.id, data: values },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(deal.id, {
      onSuccess: () => router.push("/deals"),
    });
  };

  const stages = pipeline?.stages ?? [];
  const currentStageIndex = stages.findIndex((s) => s.id === deal.stageId);
  const currSym = CURRENCIES.find((c) => c.value === deal.currency)?.symbol ?? "$";
  const formattedValue = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(deal.value);

  return (
    <div className="space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push("/deals")}>
          <ArrowLeft className="mr-1.5 size-4" />
          Deals
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="mr-1.5 size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 size-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{deal.title}</h1>
            <p className="text-3xl font-bold text-primary">
              {currSym}{formattedValue}
            </p>
          </div>
          <Badge
            variant={deal.status === "won" ? "default" : deal.status === "lost" ? "destructive" : "secondary"}
            className="text-sm capitalize"
          >
            {deal.status}
          </Badge>
        </div>

        {/* Stage progress bar */}
        <div className="mt-6">
          <div className="flex gap-1">
            {stages
              .filter((s) => s.order <= 4)
              .map((stage, idx) => {
                const isCurrent = stage.id === deal.stageId;
                const isPast = idx < currentStageIndex;
                const isWon = deal.status === "won" && stage.order === 4;
                return (
                  <div key={stage.id} className="flex-1 space-y-1">
                    <div
                      className={`h-2 rounded-full transition-colors ${
                        isPast || isCurrent || isWon
                          ? "opacity-100"
                          : "opacity-20"
                      }`}
                      style={{ backgroundColor: stage.color }}
                    />
                    <p
                      className={`text-[10px] text-center ${
                        isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage.name}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Deal details */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Deal Information</h3>
          <Separator className="my-3" />
          <div className="space-y-3">
            <InfoRow icon={DollarSign} label="Value" value={`${currSym}${formattedValue} ${deal.currency}`} />
            <InfoRow icon={Percent} label="Probability" value={`${deal.probability}%`} />
            {deal.expectedCloseDate && (
              <InfoRow
                icon={Calendar}
                label="Expected Close"
                value={format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}
              />
            )}
            {deal.actualCloseDate && (
              <InfoRow
                icon={Calendar}
                label="Closed On"
                value={format(new Date(deal.actualCloseDate), "MMM d, yyyy")}
              />
            )}
            {deal.lostReason && (
              <InfoRow icon={Trash2} label="Lost Reason" value={deal.lostReason} />
            )}
          </div>
        </div>

        {/* Associated entities */}
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Related</h3>
          <Separator className="my-3" />
          <div className="space-y-3">
            {deal.contact && (
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
                onClick={() => router.push(`/contacts/${deal.contactId}`)}
              >
                <Avatar className="size-8">
                  <AvatarImage src={deal.contact.avatar} />
                  <AvatarFallback className="text-xs">
                    {deal.contact.firstName[0]}{deal.contact.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {deal.contact.firstName} {deal.contact.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">Contact</p>
                </div>
              </button>
            )}
            {deal.company && (
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent"
                onClick={() => router.push(`/companies/${deal.companyId}`)}
              >
                <Avatar className="size-8">
                  <AvatarImage src={deal.company.logo} />
                  <AvatarFallback className="text-xs">
                    {deal.company.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{deal.company.name}</p>
                  <p className="text-xs text-muted-foreground">Company</p>
                </div>
              </button>
            )}
            {deal.owner && (
              <div className="flex items-center gap-3 p-2">
                <Avatar className="size-8">
                  <AvatarImage src={deal.owner.avatar} />
                  <AvatarFallback className="text-xs">
                    {deal.owner.firstName[0]}{deal.owner.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {deal.owner.firstName} {deal.owner.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="rounded-lg border bg-card p-6 md:col-span-2">
          <h3 className="font-semibold">Details</h3>
          <Separator className="my-3" />
          <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm">
            {deal.tags.length > 0 && (
              <div>
                <span className="text-muted-foreground">Tags</span>
                <div className="mt-1 flex gap-1">
                  {deal.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Created</span>
              <p>{format(new Date(deal.createdAt), "MMM d, yyyy")}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Updated</span>
              <p>{formatDistanceToNow(new Date(deal.updatedAt), { addSuffix: true })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Notes</h3>
        <NotesPanel entityType="deal" entityId={deal.id} />
      </div>

      {/* Files */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4">Files</h3>
        <FilesPanel entityType="deal" entityId={deal.id} />
      </div>

      {/* Edit dialog */}
      <DealFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        deal={deal}
        isLoading={updateMutation.isPending}
        onSubmit={handleUpdate}
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Deal"
        description={`Are you sure you want to delete "${deal.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfoRow helper
// ---------------------------------------------------------------------------

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <span>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DealDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      <div className="rounded-lg border p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-10 w-32" />
        <div className="mt-6 flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-2 flex-1 rounded-full" />
          ))}
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  );
}
