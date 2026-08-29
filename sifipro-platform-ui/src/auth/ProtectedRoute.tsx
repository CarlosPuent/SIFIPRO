import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { defaultRoute } from "../app/router/routes";
import type { AuthRole } from "./auth.types";
import { userHasAnyRole } from "./role-utils";
import { useAuth } from "./useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: AuthRole[];
};

export function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-5 py-3 text-sm font-medium text-slate-600 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/75 dark:text-slate-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500 dark:border-slate-600 dark:border-t-slate-300" />
          Restoring secure session...
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAuth && !userHasAnyRole(user, allowedRoles)) {
    return <Navigate to={defaultRoute} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
