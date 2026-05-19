import { apiClient } from "../../lib/api-client";
import type {
  CreateRewardRequest,
  RewardResponse,
  UpdateRewardRequest,
} from "./rewards.types";

export async function getAllRewards(): Promise<RewardResponse[]> {
  const response = await apiClient.get<RewardResponse[]>("/api/rewards");
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

export async function getRewardById(id: number): Promise<RewardResponse> {
  const response = await apiClient.get<RewardResponse>(`/api/rewards/${id}`);
  return response.data;
}

export async function createReward(payload: CreateRewardRequest): Promise<RewardResponse> {
  const response = await apiClient.post<RewardResponse>("/api/rewards", payload);
  return response.data;
}

export async function updateReward(
  id: number,
  payload: UpdateRewardRequest,
): Promise<RewardResponse> {
  const response = await apiClient.put<RewardResponse>(`/api/rewards/${id}`, payload);
  return response.data;
}

export async function activateReward(id: number): Promise<void> {
  await apiClient.patch(`/api/rewards/${id}/activate`);
}

export async function deactivateReward(id: number): Promise<void> {
  await apiClient.patch(`/api/rewards/${id}/deactivate`);
}
