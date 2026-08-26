import { apiClient } from "./api-client";
import type { Company, PaginatedResponse, SearchParams } from "@/types";

export const companiesService = {
  async getAll(params?: SearchParams): Promise<PaginatedResponse<Company>> {
    return apiClient.get<PaginatedResponse<Company>>("/companies", params);
  },

  async getById(id: string): Promise<Company | undefined> {
    return apiClient.get<Company>(`/companies/${id}`);
  },

  async create(
    data: Omit<Company, "id" | "createdAt" | "updatedAt">
  ): Promise<Company> {
    return apiClient.post<Company>("/companies", data);
  },

  async update(id: string, data: Partial<Company>): Promise<Company> {
    return apiClient.patch<Company>(`/companies/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/companies/${id}`);
  },
};
