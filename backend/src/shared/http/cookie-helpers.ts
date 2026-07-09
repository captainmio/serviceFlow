import type { Request } from "express";

export const readCookieValue = (request: Request, cookieName: string) => {
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

