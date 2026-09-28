import { createContext } from "react";
import type { AuthUser, LoginRequest } from "./auth.types";

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
};

// Kept apart from AuthContext.tsx so that file only exports its provider component
// (required by react-refresh for fast refresh to work).
export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);
