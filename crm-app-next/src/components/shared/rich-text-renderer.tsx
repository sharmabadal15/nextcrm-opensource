"use client";

import { cn } from "@/lib/utils";

interface RichTextRendererProps {
  content: string;
  className?: string;
}

export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content || content === "<p></p>") {
    return (
      <p className="text-sm text-muted-foreground italic">No content</p>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
