export const userRoles = ["admin", "manager", "team_member"] as const;

export type UserRole = (typeof userRoles)[number];
