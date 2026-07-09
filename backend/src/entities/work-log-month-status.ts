export const workLogMonthStatuses = ["pending", "approved", "rejected"] as const;

export type WorkLogMonthStatus = (typeof workLogMonthStatuses)[number];
