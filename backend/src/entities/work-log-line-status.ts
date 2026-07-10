export const workLogLineStatuses = ["pending", "approved", "rejected"] as const;

export type WorkLogLineStatus = (typeof workLogLineStatuses)[number];
