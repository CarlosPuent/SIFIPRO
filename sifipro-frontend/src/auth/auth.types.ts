export type AuthRole = "ADMIN" | "STAFF";

export type TenantSummary = {
  id: number;
  name: string;
  code: string;
  active: boolean;
};

export type AuthUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: AuthRole;
  active: boolean;
  tenant: TenantSummary;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};
