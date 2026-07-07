import type { UserRole } from "../../entities/user-role.js";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthenticatedUser;
}

export interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  tokenType: "access" | "refresh";
}
