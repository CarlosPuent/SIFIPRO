import { apiClient } from "../../lib/api-client";
import type {
  CreateUserRequest,
  UpdateUserPasswordRequest,
  UpdateUserRequest,
  UserResponse,
} from "./users.types";

export async function getUsers(): Promise<UserResponse[]> {
  const response = await apiClient.get<UserResponse[]>("/api/users");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getUserById(id: number): Promise<UserResponse> {
  const response = await apiClient.get<UserResponse>(`/api/users/${id}`);
  return response.data;
}

export async function createUser(payload: CreateUserRequest): Promise<UserResponse> {
  const response = await apiClient.post<UserResponse>("/api/users", payload);
  return response.data;
}

export async function updateUser(
  id: number,
  payload: UpdateUserRequest,
): Promise<UserResponse> {
  const response = await apiClient.put<UserResponse>(`/api/users/${id}`, payload);
  return response.data;
}

export async function activateUser(id: number): Promise<void> {
  await apiClient.patch(`/api/users/${id}/activate`);
}

export async function deactivateUser(id: number): Promise<void> {
  await apiClient.patch(`/api/users/${id}/deactivate`);
}

export async function updateUserPassword(
  id: number,
  payload: UpdateUserPasswordRequest,
): Promise<void> {
  await apiClient.patch(`/api/users/${id}/password`, payload);
}
