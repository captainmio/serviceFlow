import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { config } from "../config";
import { useAuthStore } from "../stores/auth-store";
import type { AuthResponse } from "../types/auth";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const parseAxiosError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const responseMessage = (error.response?.data as { message?: string } | undefined)?.message;
    return new Error(responseMessage ?? error.message ?? "Request failed");
  }

  return error instanceof Error ? error : new Error("Request failed");
};

let refreshRequest: Promise<void> | null = null;

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

const refreshSession = async () => {
  if (!refreshRequest) {
    refreshRequest = apiClient
      .post<AuthResponse>("/auth/refresh")
      .then(({ data }) => {
        useAuthStore.getState().setAuthenticated(data.user);
      })
      .catch((error: unknown) => {
        useAuthStore.getState().setAnonymous();
        throw parseAxiosError(error);
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequestConfig | undefined;
    const requestUrl = request?.url ?? "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh");
    const isLoginRequest = requestUrl.includes("/auth/login");
    const isLogoutRequest = requestUrl.includes("/auth/logout");

    if (
      error.response?.status === 401 &&
      request &&
      !request._retry &&
      !isRefreshRequest &&
      !isLoginRequest &&
      !isLogoutRequest
    ) {
      request._retry = true;

      try {
        await refreshSession();
        return apiClient(request);
      } catch (refreshError: unknown) {
        return Promise.reject(parseAxiosError(refreshError));
      }
    }

    return Promise.reject(parseAxiosError(error));
  }
);
