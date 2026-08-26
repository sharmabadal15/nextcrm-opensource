// Components
export { DealsView } from "./components/deals-view";
export { DealsKanban } from "./components/deals-kanban";
export { DealsListTable } from "./components/deals-list-table";
export { DealDetailView } from "./components/deal-detail-view";
export { DealFormDialog } from "./components/deal-form-dialog";
export { getDealColumns } from "./components/deals-columns";

// Hooks
export {
  useDeals,
  useDeal,
  useDealsByPipeline,
  useCreateDeal,
  useUpdateDeal,
  useUpdateDealStage,
  useDeleteDeal,
  dealKeys,
} from "./hooks/use-deals";

// Schema
export {
  dealFormSchema,
  type DealFormValues,
} from "./schemas/deal-schema";
