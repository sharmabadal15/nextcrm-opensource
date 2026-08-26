import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";

interface UseOptimisticMutationOptions<TData, TVariables, TContext> {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  updateCache: (
    oldData: unknown,
    variables: TVariables
  ) => unknown;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

export function useOptimisticMutation<
  TData = unknown,
  TVariables = unknown,
>({
  queryKey,
  mutationFn,
  updateCache,
  successMessage,
  errorMessage = "Something went wrong. Changes have been reverted.",
  onSuccess,
  onError,
}: UseOptimisticMutationOptions<TData, TVariables, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (oldData: unknown) =>
        updateCache(oldData, variables)
      );

      return { previousData };
    },
    onError: (error: Error, variables: TVariables, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(errorMessage);
      onError?.(error, variables);
    },
    onSuccess: (data: TData, variables: TVariables) => {
      if (successMessage) {
        toast.success(successMessage);
      }
      onSuccess?.(data, variables);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
