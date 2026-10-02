import { apiClient } from "../../lib/api-client";
import type {
  CreateRedemptionRequest,
  CustomerResponse,
  ProgramPointsBalanceResponse,
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

// Points the customer can redeem in one program (the value tenant-api validates
// redemptions against), which can differ from the global pointsBalance.
export async function getCustomerProgramBalance(
  customerId: number,
  programConfigId: number,
): Promise<ProgramPointsBalanceResponse> {
  const response = await apiClient.get<ProgramPointsBalanceResponse>(
    `/api/redemptions/customer/${customerId}/program/${programConfigId}/balance`,
  );
  return response.data;
}
