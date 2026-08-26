"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { KanbanSkeleton } from "@/components/shared/loading-skeleton";

const DealsView = dynamic(
  () => import("@/features/deals").then((m) => ({ default: m.DealsView })),
  { loading: () => <KanbanSkeleton />, ssr: false }
);

export default function DealsPage() {
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Deals"
        description="Manage your sales pipeline"
      />
      <DealsView />
    </div>
  );
}
