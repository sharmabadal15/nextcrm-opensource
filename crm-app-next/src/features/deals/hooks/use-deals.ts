import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dealsService } from "@/services/deals";
import type { Deal, SearchParams } from "@/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const dealKeys = {
  all: ["deals"] as const,
  lists: () => [...dealKeys.all, "list"] as const,
  list: (params: SearchParams) => [...dealKeys.lists(), params] as const,
  pipeline: (pipelineId: string) =>
    [...dealKeys.all, "pipeline", pipelineId] as const,
  details: () => [...dealKeys.all, "detail"] as const,
  detail: (id: string) => [...dealKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useDeals(params: SearchParams) {
  return useQuery({
    queryKey: dealKeys.list(params),
    queryFn: () => dealsService.getAll(params),
  });
}

export function useDealsByPipeline(pipelineId: string) {
  return useQuery({
    queryKey: dealKeys.pipeline(pipelineId),
    queryFn: () => dealsService.getByPipeline(pipelineId),
    enabled: !!pipelineId,
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: dealKeys.detail(id),
    queryFn: () => dealsService.getById(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Deal, "id" | "createdAt" | "updatedAt">) =>
      dealsService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all });
      toast.success("Deal created");
    },
    onError: () => toast.error("Failed to create deal"),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Deal> }) =>
      dealsService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: dealKeys.all });
      qc.invalidateQueries({ queryKey: dealKeys.detail(id) });
      toast.success("Deal updated");
    },
    onError: () => toast.error("Failed to update deal"),
  });
}

export function useUpdateDealStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      dealsService.updateStage(id, stageId),
    onMutate: async ({ id, stageId }) => {
      // Cancel in-flight pipeline queries only
      await qc.cancelQueries({ queryKey: ["deals", "pipeline"] });

      // Snapshot pipeline caches
      const prevQueries = qc.getQueriesData<Deal[]>({
        queryKey: ["deals", "pipeline"],
      });

      // Optimistically update pipeline deal arrays only (not paginated list queries)
      qc.setQueriesData<Deal[]>({ queryKey: ["deals", "pipeline"] }, (old) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((d) =>
          d.id === id ? { ...d, stageId, updatedAt: new Date().toISOString() } : d
        );
      });

      return { prevQueries };
    },
    onError: (_err, _vars, context) => {
      context?.prevQueries.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      toast.error("Failed to move deal");
    },
    onSuccess: () => {
      toast.success("Deal moved successfully");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealKeys.all });
      toast.success("Deal deleted");
    },
    onError: () => toast.error("Failed to delete deal"),
  });
}
