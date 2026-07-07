import { create } from "zustand";
import type { AuthResponse, AuthUser } from "../types/auth";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setSession: (session: AuthResponse) => void;
  logout: () => void;
}

const readInitialToken = () => window.localStorage.getItem("service-flow-token");
const readInitialUser = (): AuthUser | null => {
  const storedUser = window.localStorage.getItem("service-flow-user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: readInitialToken(),
  user: readInitialUser(),
  setSession: (session) => {
    window.localStorage.setItem("service-flow-token", session.token);
    window.localStorage.setItem("service-flow-user", JSON.stringify(session.user));
    set({
      token: session.token,
      user: session.user
    });
  },
  logout: () => {
    window.localStorage.removeItem("service-flow-token");
    window.localStorage.removeItem("service-flow-user");
    set({
      token: null,
      user: null
    });
  }
}));
