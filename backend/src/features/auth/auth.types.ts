import type { UserRole } from "../../entities/user-role.js";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthenticatedUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
