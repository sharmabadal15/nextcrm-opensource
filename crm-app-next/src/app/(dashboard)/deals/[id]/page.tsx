import { use } from "react";
import { DealDetailView } from "@/features/deals";

export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <DealDetailView dealId={id} />;
}
