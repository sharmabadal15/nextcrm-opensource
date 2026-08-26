import { z } from "zod";

export const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  title: z.string().optional(),
  companyId: z.string().optional(),
  status: z.enum(["active", "inactive", "lead", "prospect", "customer"]),
  source: z
    .enum(["website", "referral", "linkedin", "cold_call", "event", "other"])
    .optional(),
  ownerId: z.string().min(1, "Owner is required"),
  tags: z.array(z.string()).default([]),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
