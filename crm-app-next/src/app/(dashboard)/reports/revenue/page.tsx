"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/shared/page-header";
import { ReportSkeleton } from "@/components/shared/loading-skeleton";

const RevenueReport = dynamic(
  () => import("@/features/reports").then((m) => ({ default: m.RevenueReport })),
  { loading: () => <ReportSkeleton />, ssr: false }
);

export default function RevenueReportPage() {
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
        title="Revenue Report"
        description="Revenue over time, by source, and won vs lost comparison"
      />
      <RevenueReport />
    </div>
  );
}
