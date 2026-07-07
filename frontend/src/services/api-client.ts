import { config } from "../config";
import { useAuthStore } from "../stores/auth-store";
import type { AuthResponse } from "../types/auth";

export const parseError = async (response: Response) => {
  const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
  throw new Error(errorBody?.message ?? "Request failed");
};

interface ApiFetchOptions extends RequestInit {
  retryOnAuth?: boolean;
}

let refreshRequest: Promise<void> | null = null;

const refreshSession = async () => {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      const response = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        useAuthStore.getState().setAnonymous();
        await parseError(response);
      }

      const body = (await response.json()) as AuthResponse;
      useAuthStore.getState().setAuthenticated(body.user);
    })().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
};

export const apiFetch = async (input: string, init: ApiFetchOptions = {}): Promise<Response> => {
  const { retryOnAuth = true, headers, credentials, ...rest } = init;
  const response = await fetch(input, {
    ...rest,
    headers,
    credentials: credentials ?? "include"
  });

  if (response.status === 401 && retryOnAuth) {
    try {
      await refreshSession();
    } catch {
      return response;
    }

    return fetch(input, {
      ...rest,
      headers,
      credentials: credentials ?? "include"
    });
  }

  return response;
};

export const fetchJson = async <T>(input: string, init?: ApiFetchOptions): Promise<T> => {
  const response = await apiFetch(input, init);

  if (!response.ok) {
    await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const jsonHeaders = {
  "Content-Type": "application/json"
};
