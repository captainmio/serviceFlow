import { z } from "zod";
import { workLogMonthStatuses } from "../../entities/work-log-month-status.js";

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format");

export const workLogPayloadSchema = z.object({
  jobServiceId: z.string().uuid("Select a valid assigned service"),
  workDate: dateField,
  hours: z.coerce.number().positive("Reported work hours must be greater than zero"),
  notes: z.string().trim().max(2000).optional().default("")
});

export const workLogListQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  monthStart: dateField.optional()
});

export const workLogPeriodQuerySchema = z.object({
  projectId: z.string().uuid("Select a valid project"),
  monthStart: dateField
});

export const workLogPeriodReviewSchema = z
  .object({
    projectId: z.string().uuid("Select a valid project"),
    monthStart: dateField,
    status: z.enum(workLogMonthStatuses),
    rejectionReason: z.string().trim().max(2000).nullable().optional()
  })
  .superRefine((value, context) => {
    if (value.status === "rejected" && !value.rejectionReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a rejection reason when rejecting a work-log month",
        path: ["rejectionReason"]
      });
    }
  });

export const workLogWeekSubmissionSchema = z.object({
  projectId: z.string().uuid("Select a valid project"),
  weekStart: dateField,
  monthStart: dateField
});

export type WorkLogPayload = z.infer<typeof workLogPayloadSchema>;
export type WorkLogListQuery = z.infer<typeof workLogListQuerySchema>;
export type WorkLogPeriodQuery = z.infer<typeof workLogPeriodQuerySchema>;
export type WorkLogPeriodReviewPayload = z.infer<typeof workLogPeriodReviewSchema>;
export type WorkLogWeekSubmissionPayload = z.infer<typeof workLogWeekSubmissionSchema>;
