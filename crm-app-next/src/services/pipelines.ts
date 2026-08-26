import { apiClient } from "./api-client";
import type { Pipeline } from "@/types";

export const pipelinesService = {
  async getAll(): Promise<Pipeline[]> {
    return apiClient.get<Pipeline[]>("/pipelines");
  },

  async getById(id: string): Promise<Pipeline> {
    return apiClient.get<Pipeline>(`/pipelines/${id}`);
  },
};
