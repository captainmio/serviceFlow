import type { UserRole } from "./auth";

export interface TeamMember {
  uuid: string;
  id: number;
  firstName: string;
  lastName: string;
  name: string;
  title: string;
  email: string;
  active: boolean;
  isLoginBlocked: boolean;
  startDate: string;
  endDate: string | null;
  role: UserRole;
  maxWorkHoursPerDay: number;
  maxWorkHoursPerWeek: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberPayload {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  active: boolean;
  isLoginBlocked: boolean;
  startDate: string;
  endDate: string | null;
  role: UserRole;
  maxWorkHoursPerDay: number;
  maxWorkHoursPerWeek: number;
  password?: string;
}
