import type { UserRole } from "../../entities/user-role.js";

export interface UserOptionResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface TeamMemberResponse {
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
