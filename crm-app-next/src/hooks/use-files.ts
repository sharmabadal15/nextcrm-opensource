import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { filesService } from "@/services/files";
import type { FileAttachment, FileCategory } from "@/types";

export const fileKeys = {
  all: ["files"] as const,
  entity: (entityType: string, entityId: string) =>
    [...fileKeys.all, entityType, entityId] as const,
};

export function useFiles(
  entityType: FileAttachment["entityType"],
  entityId: string
) {
  return useQuery({
    queryKey: fileKeys.entity(entityType, entityId),
    queryFn: () => filesService.getByEntity(entityType, entityId),
    enabled: !!entityId,
  });
}

export function useUploadFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      entityType,
      entityId,
      category,
      onProgress,
    }: {
      file: File;
      entityType: FileAttachment["entityType"];
      entityId: string;
      category?: FileCategory;
      onProgress?: (pct: number) => void;
    }) => filesService.upload(file, entityType, entityId, category, onProgress),
    onSuccess: (attachment) => {
      qc.invalidateQueries({
        queryKey: fileKeys.entity(attachment.entityType, attachment.entityId),
      });
      toast.success(`Uploaded "${attachment.name}"`);
    },
    onError: () => toast.error("Upload failed"),
  });
}

export function useDeleteFile() {
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
    }) => filesService.delete(id),
    onSuccess: (_, { entityType, entityId }) => {
      qc.invalidateQueries({
        queryKey: fileKeys.entity(entityType, entityId),
      });
      toast.success("File deleted");
    },
    onError: () => toast.error("Failed to delete file"),
  });
}
