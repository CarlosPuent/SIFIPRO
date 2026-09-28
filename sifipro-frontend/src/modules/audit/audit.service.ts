import { apiClient } from "../../lib/api-client";
import type {
  AuditFilters,
  AuditPage,
  PointsAdjustmentRequest,
  PointsAdjustmentResponse,
} from "./audit.types";

// ADMIN only. The backend always limits the log to the authenticated tenant; the
// filters only narrow the result.
export async function getAuditMovements(
  filters: AuditFilters,
  page: number,
  size: number,
): Promise<AuditPage> {
  const params: Record<string, string | number> = { page, size };
  if (filters.from) params.from = filters.from;
  if (filters.to) params.to = filters.to;
  if (filters.type) params.type = filters.type;
  if (filters.customerId) params.customerId = filters.customerId;
  if (filters.userId) params.userId = filters.userId;

  const response = await apiClient.get<AuditPage>("/api/audit/points-movements", { params });
  return response.data;
}

// ADMIN only: adds (positive) or removes (negative) points in one program, with a reason.
export async function adjustCustomerPoints(
  customerId: number,
  payload: PointsAdjustmentRequest,
): Promise<PointsAdjustmentResponse> {
  const response = await apiClient.post<PointsAdjustmentResponse>(
    `/api/customers/${customerId}/adjustments`,
    payload,
  );
  return response.data;
}
