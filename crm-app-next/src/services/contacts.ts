import { apiClient } from "./api-client";
import type {
  Contact,
  PaginatedResponse,
  SearchParams,
} from "@/types";

export const contactsService = {
  async getAll(params?: SearchParams): Promise<PaginatedResponse<Contact>> {
    return apiClient.get<PaginatedResponse<Contact>>("/contacts", params);
  },

  async getById(id: string): Promise<Contact | undefined> {
    return apiClient.get<Contact>(`/contacts/${id}`);
  },

  async create(
    data: Omit<Contact, "id" | "createdAt" | "updatedAt">
  ): Promise<Contact> {
    return apiClient.post<Contact>("/contacts", data);
  },

  async update(id: string, data: Partial<Contact>): Promise<Contact> {
    return apiClient.patch<Contact>(`/contacts/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/contacts/${id}`);
  },
};
