import { create } from "zustand";
import type { AuthUser } from "../types/auth";

interface AuthState {
  status: "loading" | "authenticated" | "anonymous";
  user: AuthUser | null;
  setAuthenticated: (user: AuthUser) => void;
  setAnonymous: () => void;
  setLoading: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  setAuthenticated: (user) => {
    set({
      status: "authenticated",
      user
    });
  },
  setAnonymous: () => {
    set({
      status: "anonymous",
      user: null
    });
  },
  setLoading: () => {
    set({
      status: "loading"
    });
  }
}));
