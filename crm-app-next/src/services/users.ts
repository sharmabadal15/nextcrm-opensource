import { apiClient } from "./api-client";
import type { User, PaginatedResponse, SearchParams } from "@/types";

export const usersService = {
  async getAll(params?: SearchParams): Promise<PaginatedResponse<User>> {
    return apiClient.get<PaginatedResponse<User>>("/users", params);
  },

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, data);
  },

  async deactivate(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },
};
