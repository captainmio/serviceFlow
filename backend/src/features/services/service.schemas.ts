import { z } from "zod";

export const servicePayloadSchema = z.object({
  name: z.string().trim().min(1, "Service name is required").max(160),
  description: z.string().trim().max(255).default(""),
  defaultHourlyRate: z.coerce.number().positive("Default hourly rate must be greater than 0"),
  status: z.enum(["active", "inactive"])
});

export const serviceListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["active", "inactive"]).optional()
});

export type ServicePayload = z.infer<typeof servicePayloadSchema>;
export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;
