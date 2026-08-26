"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { ReportSkeleton } from "@/components/shared/loading-skeleton";

const ActivityReport = dynamic(
  () => import("@/features/reports").then((m) => ({ default: m.ActivityReport })),
  { loading: () => <ReportSkeleton />, ssr: false }
);

export default function ActivityReportPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1.5 size-4" />
          Reports
        </Button>
      </div>
      <PageHeader
        title="Activity Report"
        description="Activities by type, per rep, and trends over time"
      />
      <ActivityReport />
    </div>
  );
}
