import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { activitiesService } from "@/services/activities";
import type { Activity, SearchParams } from "@/types";

export const activityKeys = {
  all: ["activities"] as const,
  lists: () => [...activityKeys.all, "list"] as const,
  list: (params?: SearchParams) => [...activityKeys.lists(), params] as const,
  details: () => [...activityKeys.all, "detail"] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
};

export function useActivities(params?: SearchParams) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn: () => activitiesService.getAll(params),
  });
}

export function useActivity(id: string) {
  return useQuery({
    queryKey: activityKeys.detail(id),
    queryFn: () => activitiesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Activity, "id" | "createdAt" | "updatedAt">) =>
      activitiesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.all });
      toast.success("Activity created");
    },
    onError: () => toast.error("Failed to create activity"),
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Activity> }) =>
      activitiesService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.all });
      toast.success("Activity updated");
    },
    onError: () => toast.error("Failed to update activity"),
  });
}

export function useToggleActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesService.toggleComplete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: activityKeys.all });
      const prevQueries = qc.getQueriesData({ queryKey: activityKeys.all });
      // Optimistically toggle
      qc.setQueriesData<{ data: Activity[] }>({ queryKey: activityKeys.lists() }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((a) =>
            a.id === id ? { ...a, isCompleted: !a.isCompleted } : a
          ),
        };
      });
      return { prevQueries };
    },
    onError: (_err, _id, context) => {
      context?.prevQueries.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      toast.error("Failed to update activity");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activitiesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: activityKeys.all });
      toast.success("Activity deleted");
    },
    onError: () => toast.error("Failed to delete activity"),
  });
}
