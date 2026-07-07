import { config } from "../config";
import type { AuthResponse } from "../types/auth";
import { parseError } from "./api-client";

interface LoginPayload {
  email: string;
  password: string;
}

export const loginRequest = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as AuthResponse;
};
