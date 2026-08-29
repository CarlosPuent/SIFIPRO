import { apiClient } from "../../lib/api-client";
import type {
  CreateTenantRequest,
  PageResponse,
  TenantResponse,
} from "./tenant.types";

export async function getTenants(): Promise<TenantResponse[]> {
  // size=100 is a pragmatic ceiling for this stage (no pagination controls in the
  // UI yet) — the backend defaults to 20 per page, which would silently hide
  // tenants beyond that in a growing list.
  const response = await apiClient.get<PageResponse<TenantResponse>>(
    "/api/platform/tenants",
    { params: { size: 100, sort: "createdAt,desc" } },
  );

  return Array.isArray(response.data?.content) ? response.data.content : [];
}

export async function createTenant(
  payload: CreateTenantRequest,
): Promise<TenantResponse> {
  const response = await apiClient.post<TenantResponse>(
    "/api/platform/tenants",
    payload,
  );
  return response.data;
}

export async function activateTenant(id: number): Promise<TenantResponse> {
  const response = await apiClient.patch<TenantResponse>(
    `/api/platform/tenants/${id}/activate`,
  );
  return response.data;
}

export async function deactivateTenant(id: number): Promise<TenantResponse> {
  const response = await apiClient.patch<TenantResponse>(
    `/api/platform/tenants/${id}/deactivate`,
  );
  return response.data;
}
