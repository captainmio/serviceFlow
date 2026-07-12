export const processQueueJobStatuses = ["pending", "processing", "completed", "failed"] as const;

export type ProcessQueueJobStatus = (typeof processQueueJobStatuses)[number];
