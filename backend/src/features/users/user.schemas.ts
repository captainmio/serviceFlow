import { z } from "zod";

export const userPayloadSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(80),
    lastName: z.string().trim().min(1, "Last name is required").max(80),
    title: z.string().trim().min(1, "Title is required").max(120),
    email: z.string().trim().email("Enter a valid email address").max(160),
    active: z.boolean(),
    isLoginBlocked: z.boolean(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format")
      .nullable(),
    role: z.enum(["admin", "manager", "team_member"]),
    maxWorkHoursPerDay: z.coerce.number().int().positive("Maximum work hours per day is required"),
    maxWorkHoursPerWeek: z.coerce.number().int().positive("Maximum work hours per week is required"),
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters long")
      .max(255)
      .optional()
  })
  .superRefine((value, context) => {
    if (value.endDate && value.endDate < value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date",
        path: ["endDate"]
      });
    }

    if (value.maxWorkHoursPerWeek < value.maxWorkHoursPerDay) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Weekly hours must be greater than or equal to daily hours",
        path: ["maxWorkHoursPerWeek"]
      });
    }
  });

export const userListQuerySchema = z.object({
  search: z.string().trim().optional(),
  active: z.enum(["true", "false"]).optional(),
  role: z.enum(["admin", "manager", "team_member"]).optional()
});

export type UserPayload = z.infer<typeof userPayloadSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
