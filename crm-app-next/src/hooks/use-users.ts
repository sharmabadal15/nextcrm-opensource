import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users";

export const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
};

/**
 * Fetch all users in the organization.
 * Uses a high staleTime since the user list rarely changes.
 */
export function useUsers() {
  return useQuery({
    queryKey: userKeys.all,
    queryFn: () => usersService.getAll({ page: 1, perPage: 100 }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get the flat user array from the paginated response.
 * Convenience hook for dropdowns and filters.
 */
export function useUsersList() {
  const query = useUsers();
  return { ...query, data: query.data?.data ?? [] };
}
