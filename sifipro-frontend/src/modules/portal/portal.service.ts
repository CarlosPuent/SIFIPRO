import axios from "axios";
import type {
  PortalAuthResponse,
  PortalMovement,
  PortalProfile,
  PortalReward,
  PublicTenant,
} from "./portal.types";

// The customer portal (RF-08) uses its own HTTP client and token, completely separate
// from the staff session: a customer token is only valid on /api/portal/**.
const PORTAL_TOKEN_KEY = "sifipro-portal-token";

export const portalClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

portalClient.interceptors.request.use((config) => {
  const token = getPortalToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getPortalToken(): string | null {
  try {
    return window.localStorage.getItem(PORTAL_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearPortalToken(): void {
  try {
    window.localStorage.removeItem(PORTAL_TOKEN_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}

export async function getPublicTenant(code: string): Promise<PublicTenant> {
  const response = await portalClient.get<PublicTenant>(`/api/public/tenants/${encodeURIComponent(code)}`);
  return response.data;
}

export async function portalLogin(tenantCode: string, email: string, password: string): Promise<PortalAuthResponse> {
  const response = await portalClient.post<PortalAuthResponse>("/api/portal/auth/login", {
    tenantCode,
    email,
    password,
  });
  try {
    window.localStorage.setItem(PORTAL_TOKEN_KEY, response.data.accessToken);
  } catch {
    // storage unavailable: the session lasts until the page is closed
  }
  return response.data;
}

export async function getPortalProfile(): Promise<PortalProfile> {
  return (await portalClient.get<PortalProfile>("/api/portal/me")).data;
}

export async function getPortalMovements(): Promise<PortalMovement[]> {
  return (await portalClient.get<PortalMovement[]>("/api/portal/movements")).data;
}

export async function getPortalRewards(): Promise<PortalReward[]> {
  return (await portalClient.get<PortalReward[]>("/api/portal/rewards")).data;
}
