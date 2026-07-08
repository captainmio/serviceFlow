import type { UserRole } from "../../entities/user-role.js";

export interface UserOptionResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
