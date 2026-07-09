import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../entities/user-role.js";
import { readCookieValue } from "../../shared/http/cookie-helpers.js";
import { ACCESS_TOKEN_COOKIE_NAME, verifyToken } from "./auth.service.js";

interface AuthenticatedRequestUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedRequestUser;
}

export const requireAuth = (
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
) => {
  const authorizationHeader = request.headers.authorization;
  const cookieToken = readCookieValue(request, ACCESS_TOKEN_COOKIE_NAME);
  const headerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length)
    : null;
  const token = cookieToken || headerToken;

  if (!token) {
    response.status(401).json({ message: "Authentication is required" });
    return;
  }

  try {
    const payload = verifyToken(token);

    if (payload.tokenType !== "access") {
      response.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    request.authUser = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRoles = (roles: UserRole[]) => {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    if (!roles.includes(request.authUser.role)) {
      response.status(403).json({ message: "You do not have access to perform this action" });
      return;
    }

    next();
  };
};
