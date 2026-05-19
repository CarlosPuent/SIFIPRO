export interface PurchaseTransactionResponse {
  id: number;
  programConfigId: number;
  programName?: string | null;
  customerId: number;
  customerFullName: string;
  amount: number | string;
  description: string | null;
  transactionDate: string;
  awardedPoints?: number | string;
  pointsEarned?: number | string;
  createdAt: string;
  updatedAt: string;
}

export type PointsMovementType = "EARN" | "REDEEM" | "ADJUSTMENT" | "EXPIRE";

export interface PointsMovementResponse {
  id: number;
  programConfigId: number;
  programName?: string | null;
  customerId: number;
  customerFullName?: string | null;
  type: PointsMovementType;
  points: number | string;
  description: string | null;
  referenceType: string;
  referenceId: number;
  movementDate: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface CreatePurchaseTransactionRequest {
  customerId: number;
  programConfigId: number;
  amount: number | string;
  description?: string;
  transactionDate: string;
}

export type TransactionFormSubmitPayload = {
  customerId: number;
  amount: number | string;
  description?: string;
  transactionDate: string;
};

export type TransactionFormValues = {
  customerId: string;
  amount: string;
  description: string;
  transactionDate: string;
};
