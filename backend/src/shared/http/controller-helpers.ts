import type { Response } from "express";
import { ZodError } from "zod";

interface RequestWithAuthUser<TAuthUser> {
  authUser?: TAuthUser;
}

export const readRouteParam = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : "";

export const respondWithZodError = (
  response: Response,
  error: unknown,
  message: string
) => {
  if (!(error instanceof ZodError)) {
    return false;
  }

  response.status(400).json({
    message,
    issues: error.flatten()
  });
  return true;
};

export const requireAuthenticatedUser = <TAuthUser>(
  request: RequestWithAuthUser<TAuthUser>,
  response: Response
) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication is required" });
    return null;
  }

  return request.authUser;
};

