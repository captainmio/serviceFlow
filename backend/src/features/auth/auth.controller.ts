import type { Request, Response } from "express";
import type { CookieOptions } from "express";
import { ZodError } from "zod";
import { env } from "../../config/env.js";
import { loginSchema } from "./auth.schema.js";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_MS,
  buildAuthTokens,
  buildSessionResponse,
  findUserById,
  login,
  verifyToken
} from "./auth.service.js";
import type { AuthenticatedRequest } from "./auth.middleware.js";

const readCookie = (request: Request, cookieName: string) => {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(cookieName.length + 1));
};

const buildCookieOptions = (maxAge: number): CookieOptions => ({
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
  maxAge
});

const writeAuthCookies = (response: Response, accessToken: string, refreshToken: string) => {
  response.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, buildCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, buildCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
};

const clearAuthCookies = (response: Response) => {
  response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, buildCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, buildCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
};

export const loginHandler = async (request: Request, response: Response) => {
  try {
    const credentials = loginSchema.parse(request.body);
    const user = await login(credentials);
    const { accessToken, refreshToken } = buildAuthTokens(user);

    writeAuthCookies(response, accessToken, refreshToken);
    response.status(200).json(buildSessionResponse(user));
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      response.status(400).json({
        message: "Invalid login payload",
        issues: error.flatten()
      });
      return;
    }

    if (error instanceof Error && error.message === "Invalid email or password") {
      response.status(401).json({
        message: error.message
      });
      return;
    }

    if (error instanceof Error && error.message === "This user is currently blocked from logging in") {
      response.status(403).json({
        message: error.message
      });
      return;
    }

    response.status(500).json({
      message: "Unable to log in right now"
    });
  }
};

export const sessionHandler = async (request: AuthenticatedRequest, response: Response) => {
  if (!request.authUser) {
    response.status(401).json({ message: "Authentication is required" });
    return;
  }

  response.status(200).json({
    user: request.authUser
  });
};

export const refreshHandler = async (request: Request, response: Response) => {
  try {
    const refreshToken = readCookie(request, REFRESH_TOKEN_COOKIE_NAME);

    if (!refreshToken) {
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const payload = verifyToken(refreshToken);

    if (payload.tokenType !== "refresh") {
      response.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    const user = await findUserById(payload.sub);

    if (!user) {
      clearAuthCookies(response);
      response.status(401).json({ message: "Authentication is required" });
      return;
    }

    const tokens = buildAuthTokens(user);
    writeAuthCookies(response, tokens.accessToken, tokens.refreshToken);
    response.status(200).json(buildSessionResponse(user));
  } catch {
    clearAuthCookies(response);
    response.status(401).json({ message: "Invalid or expired token" });
  }
};

export const logoutHandler = (_request: Request, response: Response) => {
  clearAuthCookies(response);
  response.status(204).send();
};
