import { ZodError } from "zod";
import type { Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  changeOwnPassword,
  createTeamMember,
  getTeamMemberByUuid,
  InvalidCurrentPasswordError,
  listAssignableUsers,
  listTeamMembers,
  TeamMemberAlreadyExistsError,
  updateTeamMember
} from "./user.service.js";
import { changePasswordSchema, userListQuerySchema, userPayloadSchema } from "./user.schemas.js";

const readRouteParam = (value: string | string[] | undefined) => {
  if (typeof value === "string") {
    return value;
  }

  return "";
};

const handleUserError = (error: unknown, response: Response) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Invalid team member payload",
      issues: error.flatten()
    });
    return true;
  }

  if (error instanceof TeamMemberAlreadyExistsError) {
    response.status(409).json({ message: error.message });
    return true;
  }

  if (error instanceof InvalidCurrentPasswordError) {
    response.status(400).json({ message: error.message });
    return true;
  }

  if (error instanceof Error && error.message === "Password is required when creating a team member") {
    response.status(400).json({ message: error.message });
    return true;
  }

  return false;
};

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

export const listTeamMembersHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const query = userListQuerySchema.parse(request.query);
    const users = await listTeamMembers(query);
    response.status(200).json(users);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid team member search query",
        issues: error.flatten()
      });
      return;
    }

    response.status(500).json({ message: "Unable to fetch team members right now" });
  }
};

export const createTeamMemberHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const payload = userPayloadSchema.parse(request.body);
    const user = await createTeamMember(payload);
    response.status(201).json(user);
  } catch (error: unknown) {
    if (handleUserError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to create team member right now" });
  }
};

export const getTeamMemberHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const user = await getTeamMemberByUuid(readRouteParam(request.params.userUuid));

    if (!user) {
      response.status(404).json({ message: "Team member not found" });
      return;
    }

    response.status(200).json(user);
  } catch {
    response.status(500).json({ message: "Unable to fetch team member right now" });
  }
};

export const updateTeamMemberHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    const payload = userPayloadSchema.parse(request.body);
    const user = await updateTeamMember(readRouteParam(request.params.userUuid), payload);

    if (!user) {
      response.status(404).json({ message: "Team member not found" });
      return;
    }

    response.status(200).json(user);
  } catch (error: unknown) {
    if (handleUserError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to update team member right now" });
  }
};

export const changeOwnPasswordHandler = async (
  request: AuthenticatedRequest,
  response: Response
) => {
  try {
    if (!request.authUser) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const payload = changePasswordSchema.parse(request.body);
    await changeOwnPassword(request.authUser.id, payload.currentPassword, payload.newPassword);
    response.status(204).send();
  } catch (error: unknown) {
    if (handleUserError(error, response)) {
      return;
    }

    response.status(500).json({ message: "Unable to change password right now" });
  }
};
