import { z } from "zod";

export const jobPayloadSchema = z.object({
  title: z.string().trim().min(1, "Job title is required").max(160),
  customerId: z.string().uuid("Select a valid customer"),
  serviceId: z.string().uuid("Select a valid service"),
  hourlyRate: z.coerce.number().positive("Hourly rate must be greater than 0")
});

export type JobPayload = z.infer<typeof jobPayloadSchema>;
