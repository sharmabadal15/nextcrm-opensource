import { useQuery } from "@tanstack/react-query";
import { pipelinesService } from "@/services/pipelines";

export const pipelineKeys = {
  all: ["pipelines"] as const,
  detail: (id: string) => [...pipelineKeys.all, id] as const,
};

export function usePipelines() {
  return useQuery({
    queryKey: pipelineKeys.all,
    queryFn: () => pipelinesService.getAll(),
    staleTime: 5 * 60 * 1000, // pipelines rarely change
  });
}

export function useDefaultPipeline() {
  const query = usePipelines();
  const pipeline = query.data?.find((p) => p.isDefault) ?? query.data?.[0];
  return { ...query, data: pipeline };
}
