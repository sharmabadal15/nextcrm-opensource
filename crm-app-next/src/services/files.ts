import { mockUsers } from "@/mocks/data";
import type { FileAttachment, FileCategory } from "@/types";

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

// In-memory store
const filesStore: FileAttachment[] = [];

export const filesService = {
  async getByEntity(
    entityType: FileAttachment["entityType"],
    entityId: string
  ): Promise<FileAttachment[]> {
    await delay();
    return filesStore
      .filter((f) => f.entityType === entityType && f.entityId === entityId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async upload(
    file: File,
    entityType: FileAttachment["entityType"],
    entityId: string,
    category: FileCategory = "other",
    onProgress?: (pct: number) => void
  ): Promise<FileAttachment> {
    // Simulate upload progress
    const steps = 5;
    for (let i = 1; i <= steps; i++) {
      await delay(200);
      onProgress?.(Math.round((i / steps) * 100));
    }

    const attachment: FileAttachment = {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      category,
      url: URL.createObjectURL(file),
      uploadedBy: mockUsers[0].id,
      entityType,
      entityId,
      createdAt: new Date().toISOString(),
    };
    filesStore.unshift(attachment);
    return attachment;
  },

  async delete(id: string): Promise<void> {
    await delay();
    const index = filesStore.findIndex((f) => f.id === id);
    if (index === -1) throw new Error("File not found");
    filesStore.splice(index, 1);
  },
};
