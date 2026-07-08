export const jobStatuses = [
  "draft",
  "assigned",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
  "invoiced",
  "paid",
  "cancelled"
] as const;

export type JobStatus = (typeof jobStatuses)[number];
