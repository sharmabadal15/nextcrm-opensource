"use client";

import { useState } from "react";
import { Kanban, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DealsKanban } from "./deals-kanban";
import { DealsListTable } from "./deals-list-table";

type ViewMode = "kanban" | "list";

export function DealsView() {
  const [view, setView] = useState<ViewMode>("kanban");

  return (
    <div className="space-y-4">
      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 w-fit">
        <Button
          variant={view === "kanban" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("kanban")}
          className="h-7 px-3 text-xs"
        >
          <Kanban className="mr-1.5 size-3.5" />
          Board
        </Button>
        <Button
          variant={view === "list" ? "default" : "ghost"}
          size="sm"
          onClick={() => setView("list")}
          className="h-7 px-3 text-xs"
        >
          <List className="mr-1.5 size-3.5" />
          List
        </Button>
      </div>

      {view === "kanban" ? <DealsKanban /> : <DealsListTable />}
    </div>
  );
}
