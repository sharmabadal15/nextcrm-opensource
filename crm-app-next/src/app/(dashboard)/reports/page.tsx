"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ReportsIndex } from "@/features/reports";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analytics and insights for your sales performance"
      />
      <ReportsIndex />
    </div>
  );
}
