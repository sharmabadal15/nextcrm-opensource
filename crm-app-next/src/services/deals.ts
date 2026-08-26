import { apiClient } from "./api-client";
import type { Deal, PaginatedResponse, SearchParams } from "@/types";

export const dealsService = {
  async getAll(params?: SearchParams): Promise<PaginatedResponse<Deal>> {
    return apiClient.get<PaginatedResponse<Deal>>("/deals", params);
  },

  async getByPipeline(pipelineId: string): Promise<Deal[]> {
    return apiClient.get<Deal[]>(`/deals/pipeline/${pipelineId}`);
  },

  async getById(id: string): Promise<Deal | undefined> {
    return apiClient.get<Deal>(`/deals/${id}`);
  },

  async create(
    data: Omit<Deal, "id" | "createdAt" | "updatedAt">
  ): Promise<Deal> {
    return apiClient.post<Deal>("/deals", data);
  },

  async update(id: string, data: Partial<Deal>): Promise<Deal> {
    return apiClient.patch<Deal>(`/deals/${id}`, data);
  },

  async updateStage(id: string, stageId: string): Promise<Deal> {
    return apiClient.patch<Deal>(`/deals/${id}/stage`, { stageId });
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/deals/${id}`);
  },
};
