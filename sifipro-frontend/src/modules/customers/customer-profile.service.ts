import { apiClient } from "../../lib/api-client";
import type {
  CustomerProfileResponse,
  PointsHistoryEntry,
} from "./customer-profile.types";

export async function getCustomerProfile(
  id: number,
): Promise<CustomerProfileResponse> {
  const response = await apiClient.get<CustomerProfileResponse>(
    `/api/customers/${id}/profile`,
  );
  return response.data;
}

export async function getCustomerPointsHistory(
  id: number,
): Promise<PointsHistoryEntry[]> {
  const response = await apiClient.get<PointsHistoryEntry[]>(
    `/api/customers/${id}/points-history`,
  );
  return Array.isArray(response.data) ? response.data : [];
}
