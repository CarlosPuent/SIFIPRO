export type RedemptionStatus = "COMPLETED" | "CANCELLED";

export interface RedemptionResponse {
  id: number;
  programConfigId: number;
  programName?: string | null;
  customerId: number;
  customerFullName: string;
  rewardId: number;
  rewardName: string;
  pointsUsed: number | string;
  redemptionDate: string;
  status: RedemptionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  pointsBalance: number | string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RewardResponse {
  id: number;
  programConfigId: number;
  programName?: string | null;
  name: string;
  description: string | null;
  requiredPoints: number | string;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRedemptionRequest {
  customerId: number;
  rewardId: number;
  redemptionDate: string;
  notes?: string;
}

export type RedemptionFormValues = {
  customerId: string;
  rewardId: string;
  redemptionDate: string;
  notes: string;
};