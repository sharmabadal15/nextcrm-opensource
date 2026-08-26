import { use } from "react";
import { CompanyDetailView } from "@/features/companies";

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <CompanyDetailView companyId={id} />;
}
