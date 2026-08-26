import type { Pipeline } from "@/types";

export const DEFAULT_PIPELINE: Pipeline = {
  id: "pipeline-1",
  name: "Sales Pipeline",
  isDefault: true,
  stages: [
    { id: "stage-1", name: "Lead", order: 0, probability: 10, color: "#6366f1" },
    { id: "stage-2", name: "Qualified", order: 1, probability: 25, color: "#8b5cf6" },
    { id: "stage-3", name: "Proposal", order: 2, probability: 50, color: "#a855f7" },
    { id: "stage-4", name: "Negotiation", order: 3, probability: 75, color: "#f59e0b" },
    { id: "stage-5", name: "Closed Won", order: 4, probability: 100, color: "#22c55e" },
    { id: "stage-6", name: "Closed Lost", order: 5, probability: 0, color: "#ef4444" },
  ],
};

export const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "INR", label: "INR (₹)", symbol: "₹" },
] as const;

export const DEFAULT_CURRENCY = "USD";
