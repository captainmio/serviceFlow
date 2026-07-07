import { z } from "zod";

export const customerPayloadSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(160),
  contactPerson: z.string().trim().min(1, "Contact person is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(160),
  phone: z.string().trim().min(1, "Phone is required").max(40),
  address: z.string().trim().min(1, "Address is required").max(255),
  status: z.enum(["active", "inactive"])
});

export const customerListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export type CustomerPayload = z.infer<typeof customerPayloadSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
