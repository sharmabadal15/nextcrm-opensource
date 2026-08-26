import { z } from "zod";

export const dealFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  value: z.coerce.number().min(0, "Value must be positive"),
  currency: z.string().default("USD"),
  pipelineId: z.string().min(1),
  stageId: z.string().min(1, "Stage is required"),
  probability: z.coerce.number().min(0).max(100).default(10),
  expectedCloseDate: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  ownerId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;
