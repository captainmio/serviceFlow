export const serviceStatuses = ["active", "inactive"] as const;

export type ServiceStatus = (typeof serviceStatuses)[number];
