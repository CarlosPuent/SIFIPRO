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
import { DashboardPage } from "../../modules/dashboard/DashboardPage";
import { CustomersPage } from "../../modules/customers/CustomersPage";
import { CustomerProfilePage } from "../../modules/customers/CustomerProfilePage";
import { RewardsPage } from "../../modules/rewards/RewardsPage";
import { TransactionsPage } from "../../modules/transactions/TransactionsPage";
import { RedemptionsPage } from "../../modules/redemptions/RedemptionsPage";
import { ReportsPage } from "../../modules/reports/ReportsPage";
import { UsersPage } from "../../modules/users/UsersPage";
import { ProgramConfigPage } from "../../modules/program-config/ProgramConfigPage";
import { ProgramProvider } from "../../modules/program-config/ProgramContext";
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
        <ProgramProvider>
          <AppLayout />
        </ProgramProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to={defaultRoute} replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "customers",
        element: <CustomersPage />,
      },
      {
        path: "customers/:id",
        element: <CustomerProfilePage />,
      },
      {
        path: "rewards",
        element: <RewardsPage />,
      },
      {
        path: "transactions",
        element: <TransactionsPage />,
      },
      {
        path: "redemptions",
        element: <RedemptionsPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "users",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "program-config",
        element: (
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <ProgramConfigPage />
          </ProtectedRoute>
        ),
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
