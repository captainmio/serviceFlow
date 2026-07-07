import { config } from "../config";
import type { AuthResponse } from "../types/auth";

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
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorBody?.message ?? "Login failed");
  }

  return (await response.json()) as AuthResponse;
};
