import { config } from "../config";
import type { AuthResponse } from "../types/auth";
import { fetchJson, jsonHeaders, parseError } from "./api-client";

interface LoginPayload {
  email: string;
  password: string;
}

export const loginRequest = async (payload: LoginPayload): Promise<AuthResponse> => {
  return fetchJson<AuthResponse>(`${config.apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: jsonHeaders,
    retryOnAuth: false,
    body: JSON.stringify(payload)
  });
};

export const getSessionRequest = async (): Promise<AuthResponse> => {
  return fetchJson<AuthResponse>(`${config.apiBaseUrl}/auth/session`);
};

export const logoutRequest = async (): Promise<void> => {
  const response = await fetch(`${config.apiBaseUrl}/auth/logout`, {
    method: "POST",
    credentials: "include"
  });

  if (!response.ok) {
    await parseError(response);
  }
};
