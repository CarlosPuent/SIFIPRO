import { apiClient } from "../../lib/api-client";
import type {
  CreateRedemptionRequest,
  CustomerResponse,
  RedemptionResponse,
  RewardResponse,
} from "./redemptions.types";

export async function getAllRedemptions(): Promise<RedemptionResponse[]> {
  const response = await apiClient.get<RedemptionResponse[]>("/api/redemptions");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getRedemptionById(
  id: number,
): Promise<RedemptionResponse> {
  const response = await apiClient.get<RedemptionResponse>(
    `/api/redemptions/${id}`,
  );
  return response.data;
}

export async function getRedemptionsByCustomerId(
  customerId: number,
): Promise<RedemptionResponse[]> {
  const response = await apiClient.get<RedemptionResponse[]>(
    `/api/redemptions/customer/${customerId}`,
  );

  return Array.isArray(response.data) ? response.data : [];
}

export async function createRedemption(
  payload: CreateRedemptionRequest,
): Promise<RedemptionResponse> {
  const response = await apiClient.post<RedemptionResponse>(
    "/api/redemptions",
    payload,
  );
  return response.data;
}

export async function getCustomers(): Promise<CustomerResponse[]> {
  const response = await apiClient.get<CustomerResponse[]>("/api/customers");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getRewardsByProgram(
  programConfigId: number,
): Promise<RewardResponse[]> {
  const response = await apiClient.get<RewardResponse[]>(
    `/api/rewards/programs/${programConfigId}`,
  );

  return Array.isArray(response.data) ? response.data : [];
}