import { apiClient } from "../../lib/api-client";
import type {
  CreateCustomerRequest,
  CustomerResponse,
  UpdateCustomerRequest,
} from "./customers.types";

export async function getCustomers(): Promise<CustomerResponse[]> {
  const response = await apiClient.get<CustomerResponse[]>("/api/customers");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getCustomerById(id: number): Promise<CustomerResponse> {
  const response = await apiClient.get<CustomerResponse>(`/api/customers/${id}`);
  return response.data;
}

export async function createCustomer(payload: CreateCustomerRequest): Promise<CustomerResponse> {
  const response = await apiClient.post<CustomerResponse>("/api/customers", payload);
  return response.data;
}

export async function updateCustomer(
  id: number,
  payload: UpdateCustomerRequest,
): Promise<CustomerResponse> {
  const response = await apiClient.put<CustomerResponse>(`/api/customers/${id}`, payload);
  return response.data;
}

export async function activateCustomer(id: number): Promise<void> {
  await apiClient.patch(`/api/customers/${id}/activate`);
}

export async function deactivateCustomer(id: number): Promise<void> {
  await apiClient.patch(`/api/customers/${id}/deactivate`);
}
