import { z } from "zod";

export const activitySchema = z.object({
  type: z.enum(["call", "email", "meeting", "task", "note", "lunch"]),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
  ownerId: z.string().min(1, "Owner is required"),
  duration: z.coerce.number().optional(),
  isCompleted: z.boolean().default(false),
});

export type ActivityFormValues = z.infer<typeof activitySchema>;
