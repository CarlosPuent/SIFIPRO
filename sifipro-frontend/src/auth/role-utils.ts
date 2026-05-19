import type { AuthRole, AuthUser } from "./auth.types";

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}

export function isStaff(user: AuthUser | null | undefined): boolean {
  return user?.role === "STAFF";
}

export function userHasAnyRole(
  user: AuthUser | null | undefined,
  allowedRoles: AuthRole[] | undefined,
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (!user) {
    return false;
  }

  return allowedRoles.includes(user.role);
}