"use client";

import { PageHeader } from "@/components/shared/page-header";
import { CompaniesTable } from "@/features/companies";

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage organizations and accounts"
      />
      <CompaniesTable />
    </div>
  );
}
