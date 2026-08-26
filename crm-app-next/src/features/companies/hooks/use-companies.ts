import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { companiesService } from "@/services/companies";
import type { Company, PaginatedResponse, SearchParams } from "@/types";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (params: SearchParams) => [...companyKeys.lists(), params] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useCompanies(params: SearchParams) {
  return useQuery({
    queryKey: companyKeys.list(params),
    queryFn: () => companiesService.getAll(params),
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => companiesService.getById(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Company, "id" | "createdAt" | "updatedAt">) =>
      companiesService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success("Company created");
    },
    onError: () => toast.error("Failed to create company"),
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) =>
      companiesService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: companyKeys.lists() });
      qc.invalidateQueries({ queryKey: companyKeys.detail(id) });
      toast.success("Company updated");
    },
    onError: () => toast.error("Failed to update company"),
  });
}

export function useDeleteCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => companiesService.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: companyKeys.lists() });
      const prevQueries = qc.getQueriesData<PaginatedResponse<Company>>({
        queryKey: companyKeys.lists(),
      });
      qc.setQueriesData<PaginatedResponse<Company>>(
        { queryKey: companyKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((c) => c.id !== id),
            meta: { ...old.meta, total: old.meta.total - 1 },
          };
        }
      );
      return { prevQueries };
    },
    onError: (_err, _id, context) => {
      context?.prevQueries.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      toast.error("Failed to delete company");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: companyKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Company deleted");
    },
  });
}
