import { z } from "zod";
import { jobStatuses } from "../../entities/job-status.js";

const optionalDateField = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format")
    .nullable()
);

const jobServiceAssignmentSchema = z.object({
  serviceId: z.string().uuid("Select a valid service"),
  hourlyRate: z.coerce.number().positive("Hourly rate must be greater than zero"),
  assignedToIds: z.array(z.string().uuid("Select a valid assignee")).min(1, "Assign at least one user to each service")
});

export const jobPayloadSchema = z
  .object({
    title: z.string().trim().min(1, "Job title is required").max(160),
    description: z.string().trim().max(2000).default(""),
    customerId: z.string().uuid("Select a valid customer"),
    projectManagerId: z.string().uuid("Select a valid project manager"),
    serviceAssignments: z.array(jobServiceAssignmentSchema).min(1, "Add at least one service to the project"),
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

    const seenServiceIds = new Set<string>();

    value.serviceAssignments.forEach((serviceAssignment, index) => {
      if (seenServiceIds.has(serviceAssignment.serviceId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each service can only be added once per project",
          path: ["serviceAssignments", index, "serviceId"]
        });
      }

      seenServiceIds.add(serviceAssignment.serviceId);
    });
  });

export const jobListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(jobStatuses).optional(),
  customerId: z.string().uuid().optional()
});

export type JobPayload = z.infer<typeof jobPayloadSchema>;
export type JobListQuery = z.infer<typeof jobListQuerySchema>;
