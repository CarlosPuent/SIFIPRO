export interface RewardResponse {
  id: number;
  programConfigId: number;
  programName?: string | null;
  name: string;
  description: string | null;
  requiredPoints: number | string;
  stock: number;
  active: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRewardRequest {
  programConfigId: number;
  name: string;
  description?: string;
  requiredPoints: number | string;
  stock: number;
}

export interface UpdateRewardRequest {
  programConfigId: number;
  name: string;
  description?: string;
  requiredPoints: number | string;
  stock: number;
}

export type RewardFormSubmitPayload = {
  name: string;
  description?: string;
  requiredPoints: number | string;
  stock: number;
};

export type RewardFormValues = {
  name: string;
  description: string;
  requiredPoints: string;
  stock: string;
};
