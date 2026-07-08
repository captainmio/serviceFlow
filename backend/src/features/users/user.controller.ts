import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { listAssignableUsers } from "./user.service.js";

export const listAssignableUsersHandler = async (
  _request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const users = await listAssignableUsers();
    response.status(200).json(users);
  } catch {
    response.status(500).json({ message: "Unable to fetch assignable users right now" });
  }
};
