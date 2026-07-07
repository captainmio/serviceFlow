import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { UserRole } from "../../entities/user-role.js";

interface AuthenticatedRequestUser {
  id: string;
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

  if (!authorizationHeader?.startsWith("Bearer ")) {
    response.status(401).json({ message: "Authentication is required" });
    return;
  }

  const token = authorizationHeader.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: UserRole;
    };

    request.authUser = {
      id: payload.sub,
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
