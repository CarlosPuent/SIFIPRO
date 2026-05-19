import { apiClient } from "../lib/api-client";
import type { AuthResponse, AuthUser, LoginRequest } from "./auth.types";

const ACCESS_TOKEN_STORAGE_KEY = "sifipro-access-token";
type CurrentUserResponse = AuthUser | { user: AuthUser };

export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/api/auth/login", payload);
  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<CurrentUserResponse>("/api/auth/me");

  return "user" in response.data ? response.data.user : response.data;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function storeAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

export function clearStoredAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
