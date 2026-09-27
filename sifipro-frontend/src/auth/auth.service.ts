import { apiClient } from "../lib/api-client";
import type { AuthResponse, AuthUser, LoginRequest } from "./auth.types";

const ACCESS_TOKEN_STORAGE_KEY = "sifipro-access-token";
// One-shot message shown on the login page after a forced logout. sessionStorage
// survives the full-page redirect to /login but not a closed tab.
const AUTH_NOTICE_STORAGE_KEY = "sifipro-auth-notice";
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

// Reasons sent by tenant-api in `details[0]` of a 401 (RestAuthenticationEntryPoint).
const FORCED_LOGOUT_NOTICES: Record<string, string> = {
  TENANT_SUSPENDED:
    "Your organization's account has been suspended. Please contact the SIFIPRO platform team.",
  USER_INACTIVE:
    "Your user account has been deactivated. Please contact your administrator.",
};

export function resolveForcedLogoutNotice(responseData: unknown): string | null {
  if (!responseData || typeof responseData !== "object") {
    return null;
  }

  const details = (responseData as { details?: unknown }).details;
  if (!Array.isArray(details)) {
    return null;
  }

  for (const detail of details) {
    if (typeof detail === "string" && detail in FORCED_LOGOUT_NOTICES) {
      return FORCED_LOGOUT_NOTICES[detail];
    }
  }

  return null;
}

export function storeAuthNotice(message: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, message);
}

export function readAuthNotice(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY);
}

export function clearAuthNotice(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
}
