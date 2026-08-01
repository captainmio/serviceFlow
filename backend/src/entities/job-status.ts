export const jobStatuses = [
  "not_started",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled"
] as const;

export type JobStatus = (typeof jobStatuses)[number];
