export const customerStatuses = ["active", "inactive"] as const;

export type CustomerStatus = (typeof customerStatuses)[number];
