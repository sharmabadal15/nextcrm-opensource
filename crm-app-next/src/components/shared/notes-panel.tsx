"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { RichTextRenderer } from "@/components/shared/rich-text-renderer";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "@/hooks/use-notes";
import type { Note } from "@/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotesPanelProps {
  entityType: Note["entityType"];
  entityId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotesPanel({ entityType, entityId }: NotesPanelProps) {
  const { data: session } = useSession();
  const { data: notes, isLoading } = useNotes(entityType, entityId);
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteNote, setDeleteNote] = useState<Note | null>(null);

  const handleCreate = () => {
    if (!content.trim() || content === "<p></p>") return;
    createMutation.mutate(
      {
        title: title || "Untitled note",
        content,
        entityType,
        entityId,
        ownerId: session?.user?.id ?? "user-1",
      },
      {
        onSuccess: () => {
          setComposing(false);
          setTitle("");
          setContent("");
        },
      }
    );
  };

  const handleUpdate = () => {
    if (!editingNote) return;
    updateMutation.mutate(
      {
        id: editingNote.id,
        data: { content: editContent },
        entityType,
        entityId,
      },
      {
        onSuccess: () => {
          setEditingNote(null);
          setEditContent("");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteNote) return;
    deleteMutation.mutate(
      { id: deleteNote.id, entityType, entityId },
      { onSuccess: () => setDeleteNote(null) }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compose */}
      {composing ? (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <Input
            placeholder="Note title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your note..."
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setComposing(false);
                setTitle("");
                setContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setComposing(true)}
        >
          <Plus className="mr-1.5 size-4" />
          Add Note
        </Button>
      )}

      {/* Notes list */}
      {(!notes || notes.length === 0) && !composing ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No notes yet. Click "Add Note" to create one.
        </p>
      ) : (
        <div className="space-y-3">
          {notes?.map((note) => (
            <div key={note.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {note.owner && (
                    <Avatar className="size-6">
                      <AvatarImage src={note.owner.avatar} />
                      <AvatarFallback className="text-[9px]">
                        {note.owner.firstName[0]}
                        {note.owner.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    <p className="text-sm font-medium">{note.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setEditingNote(note);
                      setEditContent(note.content);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => setDeleteNote(note)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {editingNote?.id === note.id ? (
                <div className="mt-3 space-y-2">
                  <RichTextEditor
                    content={editContent}
                    onChange={setEditContent}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNote(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? "Saving..." : "Update"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <RichTextRenderer content={note.content} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteNote}
        onOpenChange={(open) => !open && setDeleteNote(null)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
