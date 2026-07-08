import type { AuthResponse } from "../types/auth";
import { apiClient } from "./api-client";

interface LoginPayload {
  email: string;
  password: string;
}

export const loginRequest = async (payload: LoginPayload): Promise<AuthResponse> => {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
};

export const getSessionRequest = async (): Promise<AuthResponse> => {
  const { data } = await apiClient.get<AuthResponse>("/auth/session");
  return data;
};

export const logoutRequest = async (): Promise<void> => {
  await apiClient.post("/auth/logout");
};
