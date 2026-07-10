import { z } from "zod";
import { workLogLineStatuses } from "../../entities/work-log-line-status.js";

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format");

export const projectApprovalListQuerySchema = z.object({
  search: z.string().trim().optional(),
  monthStart: dateField
});

export const projectApprovalDetailQuerySchema = z.object({
  monthStart: dateField
});

export const workLogLineReviewSchema = z
  .object({
    status: z.enum(workLogLineStatuses),
    rejectionReason: z.string().trim().max(2000).nullable().optional()
  })
  .superRefine((value, context) => {
    if (value.status === "rejected" && !value.rejectionReason?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a rejection reason when rejecting a work log line",
        path: ["rejectionReason"]
      });
    }
  });

export const finalizeProjectApprovalSchema = z.object({
  monthStart: dateField
});

export type ProjectApprovalListQuery = z.infer<typeof projectApprovalListQuerySchema>;
export type ProjectApprovalDetailQuery = z.infer<typeof projectApprovalDetailQuerySchema>;
export type WorkLogLineReviewPayload = z.infer<typeof workLogLineReviewSchema>;
export type FinalizeProjectApprovalPayload = z.infer<typeof finalizeProjectApprovalSchema>;
