import type { UserRole } from "./auth";

export interface UserOption {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
