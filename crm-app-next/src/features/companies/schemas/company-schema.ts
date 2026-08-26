import { z } from "zod";

export const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  domain: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z
    .enum(["1-10", "11-50", "51-200", "201-1000", "1001+"])
    .optional(),
  annualRevenue: z.coerce.number().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
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

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
