"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { CalendarSkeleton } from "@/components/shared/loading-skeleton";

const CalendarView = dynamic(
  () => import("@/features/calendar").then((m) => ({ default: m.CalendarView })),
  { loading: () => <CalendarSkeleton />, ssr: false }
);

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="View and manage your schedule"
      />
      <CalendarView />
    </div>
  );
}
