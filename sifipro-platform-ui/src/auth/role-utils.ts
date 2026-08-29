import type { AuthRole, AuthUser } from "./auth.types";

export function isPlatformAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "PLATFORM_ADMIN";
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
