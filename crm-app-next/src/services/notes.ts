import { mockUsers } from "@/mocks/data";
import type { Note } from "@/types";

const delay = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

// In-memory store
const notesStore: Note[] = [];

function hydrate(note: Note): Note {
  return {
    ...note,
    owner: mockUsers.find((u) => u.id === note.ownerId),
  };
}

export const notesService = {
  async getByEntity(
    entityType: Note["entityType"],
    entityId: string
  ): Promise<Note[]> {
    await delay();
    return notesStore
      .filter((n) => n.entityType === entityType && n.entityId === entityId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(hydrate);
  },

  async create(data: Omit<Note, "id" | "createdAt" | "updatedAt" | "owner">): Promise<Note> {
    await delay();
    const note: Note = {
      ...data,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    notesStore.unshift(note);
    return hydrate(note);
  },

  async update(id: string, data: Partial<Pick<Note, "title" | "content">>): Promise<Note> {
    await delay();
    const index = notesStore.findIndex((n) => n.id === id);
    if (index === -1) throw new Error("Note not found");
    notesStore[index] = {
      ...notesStore[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return hydrate(notesStore[index]);
  },

  async delete(id: string): Promise<void> {
    await delay();
    const index = notesStore.findIndex((n) => n.id === id);
    if (index === -1) throw new Error("Note not found");
    notesStore.splice(index, 1);
  },
};
