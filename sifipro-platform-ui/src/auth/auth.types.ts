export type AuthRole = "PLATFORM_ADMIN";

export type AuthUser = {
  id: number;
  email: string;
  role: AuthRole;
  active: boolean;
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
