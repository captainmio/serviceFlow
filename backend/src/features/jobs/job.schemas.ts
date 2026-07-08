import { z } from "zod";
import { jobStatuses } from "../../entities/job-status.js";

const optionalDateField = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format")
    .nullable()
);

export const jobPayloadSchema = z
  .object({
    title: z.string().trim().min(1, "Job title is required").max(160),
    description: z.string().trim().max(2000).default(""),
    customerId: z.string().uuid("Select a valid customer"),
    assignedToIds: z.array(z.string().uuid("Select a valid assignee")).default([]),
    status: z.enum(jobStatuses),
    startDate: optionalDateField,
    dueDate: optionalDateField,
    rejectionReason: z.string().trim().max(2000).nullable().optional()
  })
  .superRefine((value, context) => {
    const requiresDates = value.status !== "draft" && value.status !== "assigned";

    if (requiresDates && !value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date is required for this status",
        path: ["startDate"]
      });
    }

    if (requiresDates && !value.dueDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date is required for this status",
        path: ["dueDate"]
      });
    }

    if (value.startDate && value.dueDate && value.startDate > value.dueDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Due date must be on or after the start date",
        path: ["dueDate"]
      });
    }

    if (value.status === "rejected" && !value.rejectionReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a rejection reason when a job is rejected",
        path: ["rejectionReason"]
      });
    }
  });

export const jobListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(jobStatuses).optional(),
  customerId: z.string().uuid().optional()
});

export type JobPayload = z.infer<typeof jobPayloadSchema>;
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
