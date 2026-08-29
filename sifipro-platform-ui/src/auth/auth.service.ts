import { apiClient } from "../lib/api-client";
import type { AuthResponse, AuthUser, LoginRequest } from "./auth.types";

// Deliberately different from tenant-ui's "sifipro-access-token" key so a browser
// with both apps open never mixes sessions between them.
const ACCESS_TOKEN_STORAGE_KEY = "platform-access-token";
type CurrentUserResponse = AuthUser | { user: AuthUser };

export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/api/platform/auth/login", payload);
  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<CurrentUserResponse>("/api/platform/auth/me");

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
