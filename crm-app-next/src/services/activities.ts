import { apiClient } from "./api-client";
import type { Activity, PaginatedResponse, SearchParams } from "@/types";

export const activitiesService = {
  async getAll(params?: SearchParams): Promise<PaginatedResponse<Activity>> {
    return apiClient.get<PaginatedResponse<Activity>>("/activities", params);
  },

  async getById(id: string): Promise<Activity | undefined> {
    return apiClient.get<Activity>(`/activities/${id}`);
  },

  async create(
    data: Omit<Activity, "id" | "createdAt" | "updatedAt">
  ): Promise<Activity> {
    return apiClient.post<Activity>("/activities", data);
  },

  async update(id: string, data: Partial<Activity>): Promise<Activity> {
    return apiClient.patch<Activity>(`/activities/${id}`, data);
  },

  async toggleComplete(id: string): Promise<Activity> {
    return apiClient.patch<Activity>(`/activities/${id}/toggle`);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/activities/${id}`);
  },
};
