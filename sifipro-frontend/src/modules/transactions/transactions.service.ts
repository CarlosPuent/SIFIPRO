import { apiClient } from "../../lib/api-client";
import type {
  CreatePurchaseTransactionRequest,
  CustomerResponse,
  PointsMovementResponse,
  PurchaseTransactionResponse,
} from "./transactions.types";

export async function getAllTransactions(): Promise<PurchaseTransactionResponse[]> {
  const response = await apiClient.get<PurchaseTransactionResponse[]>("/api/transactions");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getTransactionsByProgram(
  programConfigId: number,
): Promise<PurchaseTransactionResponse[]> {
  const response = await apiClient.get<PurchaseTransactionResponse[]>(
    `/api/transactions/program/${programConfigId}`,
  );

  return Array.isArray(response.data) ? response.data : [];
}

export async function getPointsMovementsByProgram(
  programConfigId: number,
): Promise<PointsMovementResponse[]> {
  const response = await apiClient.get<PointsMovementResponse[]>(
    `/api/transactions/program/${programConfigId}/points-movements`,
  );

  return Array.isArray(response.data) ? response.data : [];
}

export async function createPurchaseTransaction(
  payload: CreatePurchaseTransactionRequest,
): Promise<PurchaseTransactionResponse> {
  const response = await apiClient.post<PurchaseTransactionResponse>("/api/transactions", payload);
  return response.data;
}

export async function getCustomers(): Promise<CustomerResponse[]> {
  const response = await apiClient.get<CustomerResponse[]>("/api/customers");
  return Array.isArray(response.data) ? response.data : [];
}
