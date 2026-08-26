import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notesService } from "@/services/notes";
import type { Note } from "@/types";

export const noteKeys = {
  all: ["notes"] as const,
  entity: (entityType: string, entityId: string) =>
    [...noteKeys.all, entityType, entityId] as const,
};

export function useNotes(entityType: Note["entityType"], entityId: string) {
  return useQuery({
    queryKey: noteKeys.entity(entityType, entityId),
    queryFn: () => notesService.getByEntity(entityType, entityId),
    enabled: !!entityId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Note, "id" | "createdAt" | "updatedAt" | "owner">) =>
      notesService.create(data),
    onSuccess: (note) => {
      qc.invalidateQueries({
        queryKey: noteKeys.entity(note.entityType, note.entityId),
      });
      toast.success("Note saved");
    },
    onError: () => toast.error("Failed to save note"),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      entityType,
      entityId,
    }: {
      id: string;
      data: Partial<Pick<Note, "title" | "content">>;
      entityType: string;
      entityId: string;
    }) => notesService.update(id, data),
    onSuccess: (_, { entityType, entityId }) => {
      qc.invalidateQueries({
        queryKey: noteKeys.entity(entityType, entityId),
      });
      toast.success("Note updated");
    },
    onError: () => toast.error("Failed to update note"),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      entityType,
      entityId,
    }: {
      id: string;
      entityType: string;
      entityId: string;
    }) => notesService.delete(id),
    onSuccess: (_, { entityType, entityId }) => {
      qc.invalidateQueries({
        queryKey: noteKeys.entity(entityType, entityId),
      });
      toast.success("Note deleted");
    },
    onError: () => toast.error("Failed to delete note"),
  });
}
