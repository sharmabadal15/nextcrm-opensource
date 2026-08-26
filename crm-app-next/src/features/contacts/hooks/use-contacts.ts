import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { contactsService } from "@/services/contacts";
import type { Contact, PaginatedResponse, SearchParams } from "@/types";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const contactKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactKeys.all, "list"] as const,
  list: (params?: SearchParams) => [...contactKeys.lists(), params] as const,
  details: () => [...contactKeys.all, "detail"] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useContacts(params?: SearchParams) {
  return useQuery({
    queryKey: contactKeys.list(params),
    queryFn: () => contactsService.getAll(params),
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: () => contactsService.getById(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Contact, "id" | "createdAt" | "updatedAt">) =>
      contactsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      toast.success("Contact created successfully");
    },
    onError: () => {
      toast.error("Failed to create contact");
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      contactsService.update(id, data),
    onSuccess: (updatedContact) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.setQueryData(
        contactKeys.detail(updatedContact.id),
        updatedContact
      );
      toast.success("Contact updated successfully");
    },
    onError: () => {
      toast.error("Failed to update contact");
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contactsService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: contactKeys.lists() });
      const prevQueries = queryClient.getQueriesData<PaginatedResponse<Contact>>({
        queryKey: contactKeys.lists(),
      });
      queryClient.setQueriesData<PaginatedResponse<Contact>>(
        { queryKey: contactKeys.lists() },
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
        queryClient.setQueryData(key, data);
      });
      toast.error("Failed to delete contact");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Contact deleted successfully");
    },
  });
}
