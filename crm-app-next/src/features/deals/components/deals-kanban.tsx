"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { Building2, Calendar, Plus, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DealFormDialog } from "./deal-form-dialog";
import { useDealsByPipeline, useCreateDeal, useUpdateDealStage } from "../hooks/use-deals";
import { useDefaultPipeline } from "../hooks/use-pipelines";
import { CURRENCIES } from "@/config/pipeline";
import type { Deal, PipelineStage } from "@/types";
import type { DealFormValues } from "../schemas/deal-schema";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DealsKanban() {
  const router = useRouter();
  const { data: pipeline, isLoading: pipelineLoading } = useDefaultPipeline();
  const { data: deals, isLoading: dealsLoading } = useDealsByPipeline(pipeline?.id ?? "");
  const createMutation = useCreateDeal();
  const updateStageMutation = useUpdateDealStage();

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStageId, setCreateStageId] = useState<string | undefined>();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const map = new Map<string, Deal[]>();
    pipeline?.stages.forEach((s) => map.set(s.id, []));
    deals?.forEach((d) => {
      const arr = map.get(d.stageId);
      if (arr) arr.push(d);
    });
    return map;
  }, [deals, pipeline?.stages]);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals?.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    // Resolve target stage: over.id can be a stage ID OR a deal card ID
    const stageIds = new Set(pipeline!.stages.map((s) => s.id));
    let newStageId: string | undefined;

    if (stageIds.has(overId)) {
      // Dropped directly on a column
      newStageId = overId;
    } else {
      // Dropped on another deal card — find which stage that deal belongs to
      const targetDeal = deals?.find((d) => d.id === overId);
      newStageId = targetDeal?.stageId;
    }

    if (!newStageId) return;

    const deal = deals?.find((d) => d.id === dealId);
    if (!deal || deal.stageId === newStageId) return;

    updateStageMutation.mutate({ id: dealId, stageId: newStageId });
  };

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

  const openCreateForStage = (stageId: string) => {
    setCreateStageId(stageId);
    setCreateOpen(true);
  };

  const isLoading = pipelineLoading || dealsLoading;

  if (isLoading || !pipeline) return <KanbanSkeleton />;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipeline.stages
            .filter((s) => s.order < 5)
            .map((stage) => {
              const stageDeals = dealsByStage.get(stage.id) ?? [];
              const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
              return (
                <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  deals={stageDeals}
                  totalValue={totalValue}
                  onAddDeal={() => openCreateForStage(stage.id)}
                  onDealClick={(deal) => router.push(`/deals/${deal.id}`)}
                />
              );
            })}
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <DealFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStageId={createStageId}
        isLoading={createMutation.isPending}
        onSubmit={handleCreate}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------

function KanbanColumn({
  stage,
  deals,
  totalValue,
  onAddDeal,
  onDealClick,
}: {
  stage: PipelineStage;
  deals: Deal[];
  totalValue: number;
  onAddDeal: () => void;
  onDealClick: (deal: Deal) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(totalValue);

  return (
    <div className="flex w-72 shrink-0 flex-col">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between rounded-lg border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="size-2.5 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold">{stage.name}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {deals.length}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{formattedValue}</span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border border-dashed p-2 transition-colors ${
          isOver ? "border-primary bg-primary/5" : "border-transparent"
        }`}
      >
        {deals.map((deal) => (
          <DraggableDealCard
            key={deal.id}
            deal={deal}
            onClick={() => onDealClick(deal)}
          />
        ))}

        <button
          type="button"
          onClick={onAddDeal}
          className="flex items-center justify-center gap-1.5 rounded-md border border-dashed py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="size-3.5" />
          Add Deal
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable Deal Card
// ---------------------------------------------------------------------------

function DraggableDealCard({
  deal,
  onClick,
}: {
  deal: Deal;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <DealCard deal={deal} isDragging={isDragging} onClick={onClick} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deal Card
// ---------------------------------------------------------------------------

function DealCard({
  deal,
  isDragging,
  onClick,
}: {
  deal: Deal;
  isDragging?: boolean;
  onClick?: () => void;
}) {
  const currencySymbol =
    CURRENCIES.find((c) => c.value === deal.currency)?.symbol ?? "$";
  const formattedValue = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(deal.value);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md ${
        isDragging ? "rotate-2 scale-105 opacity-80 shadow-lg" : ""
      }`}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {deal.title}
        </p>

        <p className="text-lg font-bold text-primary">
          {currencySymbol}
          {formattedValue}
        </p>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {deal.company && (
            <div className="flex items-center gap-1.5">
              <Building2 className="size-3" />
              <span className="truncate">{deal.company.name}</span>
            </div>
          )}
          {deal.expectedCloseDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              <span>{format(new Date(deal.expectedCloseDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {deal.owner && (
            <div className="flex items-center gap-1.5">
              <Avatar className="size-5">
                <AvatarImage src={deal.owner.avatar} />
                <AvatarFallback className="text-[9px]">
                  {deal.owner.firstName[0]}
                  {deal.owner.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {deal.owner.firstName}
              </span>
            </div>
          )}
          <Badge variant="outline" className="text-[10px]">
            {deal.probability}%
          </Badge>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="w-72 shrink-0 space-y-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
