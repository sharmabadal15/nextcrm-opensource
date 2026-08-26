"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ActivitiesList } from "@/features/activities";

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description="Track calls, emails, meetings, and tasks"
      />
      <ActivitiesList />
    </div>
  );
}
