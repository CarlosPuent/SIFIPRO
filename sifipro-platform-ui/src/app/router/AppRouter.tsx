import {
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { defaultRoute } from "./routes";
import { AppLayout } from "../../components/layout/AppLayout";
import { AuthProvider } from "../../auth/AuthContext";
import { ProtectedRoute } from "../../auth/ProtectedRoute";
import { LoginPage } from "../../modules/auth/LoginPage";
import { TenantsPage } from "../../modules/tenants/TenantsPage";
import { NotFoundPage } from "../../pages/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <ProtectedRoute requireAuth={false}>
        <LoginPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={defaultRoute} replace />,
      },
      {
        // Kept as a redirect for anything that still links to the old stage-1
        // placeholder route.
        path: "dashboard",
        element: <Navigate to={defaultRoute} replace />,
      },
      {
        path: "tenants",
        element: <TenantsPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
