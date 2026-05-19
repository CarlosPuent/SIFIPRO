export type UserRole = "ADMIN" | "STAFF";

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserPasswordRequest {
  password: string;
}

export type UserFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
};
