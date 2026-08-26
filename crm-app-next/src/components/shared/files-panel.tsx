"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Download,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FileUploadZone } from "@/components/shared/file-upload-zone";
import { useFiles, useUploadFile, useDeleteFile } from "@/hooks/use-files";
import type { FileAttachment } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FilesPanelProps {
  entityType: FileAttachment["entityType"];
  entityId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return FileSpreadsheet;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return FileText;
  return FileIcon;
}

const CATEGORY_LABELS: Record<string, string> = {
  contract: "Contract",
  proposal: "Proposal",
  nda: "NDA",
  invoice: "Invoice",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilesPanel({ entityType, entityId }: FilesPanelProps) {
  const { data: files, isLoading } = useFiles(entityType, entityId);
  const uploadMutation = useUploadFile();
  const deleteMutation = useDeleteFile();

  const [deleteFile, setDeleteFile] = useState<FileAttachment | null>(null);
  const [uploading, setUploading] = useState<
    Map<string, number>
  >(new Map());

  const handleUpload = (newFiles: File[]) => {
    for (const file of newFiles) {
      const key = `${file.name}-${Date.now()}`;
      setUploading((prev) => new Map(prev).set(key, 0));

      uploadMutation.mutate(
        {
          file,
          entityType,
          entityId,
          onProgress: (pct) => {
            setUploading((prev) => new Map(prev).set(key, pct));
          },
        },
        {
          onSettled: () => {
            setUploading((prev) => {
              const next = new Map(prev);
              next.delete(key);
              return next;
            });
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (!deleteFile) return;
    deleteMutation.mutate(
      { id: deleteFile.id, entityType, entityId },
      { onSuccess: () => setDeleteFile(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FileUploadZone onFiles={handleUpload} />

      {/* Upload progress */}
      {uploading.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploading.entries()).map(([key, pct]) => (
            <div key={key} className="rounded-md border bg-card p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate">{key.split("-").slice(0, -1).join("-")}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files list */}
      {(!files || files.length === 0) && uploading.size === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No files yet. Drag & drop or click to upload.
        </p>
      ) : (
        <div className="space-y-2">
          {files?.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            const isImage = file.mimeType.startsWith("image/");
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                {isImage ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="size-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatSize(file.size)}</span>
                    <span>&middot;</span>
                    <span>
                      {formatDistanceToNow(new Date(file.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {file.category !== "other" && (
                      <>
                        <span>&middot;</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {CATEGORY_LABELS[file.category] ?? file.category}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={file.url}
                    download={file.name}
                    aria-label="Download"
                    className="inline-flex size-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-muted"
                  >
                    <Download className="size-4" />
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeleteFile(file)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteFile}
        onOpenChange={(open) => !open && setDeleteFile(null)}
        title="Delete File"
        description={`Delete "${deleteFile?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
