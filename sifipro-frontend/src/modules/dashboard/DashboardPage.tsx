import {
  ArrowLeftRight,
  Gift,
  ShoppingBag,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { appNavigation } from "../../app/router/routes";
import { useAuth } from "../../auth/useAuth";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { formatNumber } from "../../lib/formatters";
import { useProgram } from "../program-config/ProgramContext";
import { ActivityChart } from "./components/ActivityChart";
import { DashboardQuickActions } from "./components/DashboardQuickActions";
import { LowStockRewardsTable } from "./components/LowStockRewardsTable";
import { MetricCard } from "./components/MetricCard";
import { RecentRedemptionsTable } from "./components/RecentRedemptionsTable";
import { RecentTransactionsTable } from "./components/RecentTransactionsTable";
import { fetchOperationalDashboardData } from "./dashboard.service";
import { CustomSelect } from "../../components/ui/form/CustomSelect";
import type {
  DashboardOperationalData,
  DashboardScopeSummary,
} from "./dashboard.types";

function buildMetricItems(summary: DashboardScopeSummary) {
  return [
    {
      label: "Customers",
      value: formatNumber(summary.tenantCustomers),
      icon: Users,
      iconColor: "text-slate-600 dark:text-slate-300",
      iconBg: "bg-slate-100 dark:bg-slate-800",
    },
    {
      label: "Active Customers",
      value: formatNumber(summary.tenantActiveCustomers),
      icon: UserCheck,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      label: "Rewards",
      value: formatNumber(summary.programRewards),
      icon: Gift,
      iconColor: "text-violet-600 dark:text-violet-400",
      iconBg: "bg-violet-50 dark:bg-violet-950/50",
    },
    {
      label: "Transactions",
      value: formatNumber(summary.programTransactions),
      icon: ArrowLeftRight,
      iconColor: "text-indigo-600 dark:text-indigo-400",
      iconBg: "bg-indigo-50 dark:bg-indigo-950/50",
    },
    {
      label: "Redemptions",
      value: formatNumber(summary.programRedemptions),
      icon: ShoppingBag,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-950/50",
    },
  ];
}

function DashboardLoadingState() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-lg max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
      </div>
    </section>
  );
}

type DashboardErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function DashboardErrorState({ message, onRetry }: DashboardErrorStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Failed to load dashboard
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {message}
      </p>
      <Button variant="secondary" className="mt-5" onClick={onRetry}>
        Retry
      </Button>
    </SurfaceCard>
  );
}

type DashboardProgramSelectionStateProps = {
  isLoadingPrograms: boolean;
  programsError: string | null;
};

function DashboardProgramSelectionState({
  isLoadingPrograms,
  programsError,
}: DashboardProgramSelectionStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {isLoadingPrograms ? "Loading programs" : "No program selected"}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {isLoadingPrograms
          ? "Please wait while we resolve available programs for this tenant."
          : "Select a program from the header to load program-scoped operational metrics and activity."}
      </p>
      {programsError ? (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {programsError}
        </p>
      ) : null}
    </SurfaceCard>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const {
    currentProgram,
    programs,
    setCurrentProgramById,
    isLoadingPrograms,
    programsError,
  } = useProgram();
  const currentProgramId = currentProgram?.id ?? null;
  const [dashboardData, setDashboardData] =
    useState<DashboardOperationalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasProgramConfigRoute = useMemo(
    () => appNavigation.some((item) => item.path === "/program-config"),
    [],
  );

  const roleTitle = user?.role === "ADMIN" ? "ADMIN" : "STAFF";
  const tenantName = user?.tenant.name ?? "Tenant unavailable";

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      if (!currentProgramId) {
        // Al usar Promise.resolve().then() hacemos que la actualización de estado sea asíncrona,
        // solucionando el error del Linter de "sync setState in effect"
        Promise.resolve().then(() => {
          if (isMounted) {
            setDashboardData(null);
            setErrorMessage(null);
            setIsLoading(false);
          }
        });
        return;
      }

      Promise.resolve().then(() => {
        if (isMounted) {
          setIsLoading(true);
          setErrorMessage(null);
        }
      });

      try {
        const data = await fetchOperationalDashboardData(currentProgramId);
        if (isMounted) {
          setDashboardData(data);
        }
      } catch (error) {
        if (isMounted) {
          const message = extractErrorMessage(
            error,
            "Unexpected dashboard error.",
          );
          setErrorMessage(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [currentProgramId]);

  // Función de retry manual en caso de error
  const handleRetry = () => {
    setIsLoading(true);
    setErrorMessage(null);
    // Forzamos un re-trigger del estado o simplemente volvemos a hacer fetch
    if (currentProgramId) {
      fetchOperationalDashboardData(currentProgramId)
        .then((data) => setDashboardData(data))
        .catch((err) =>
          setErrorMessage(
            extractErrorMessage(err, "Unexpected dashboard error."),
          ),
        )
        .finally(() => setIsLoading(false));
    }
  };

  const metricItems = useMemo(() => {
    if (!dashboardData) {
      return [];
    }

    return buildMetricItems(dashboardData.summary);
  }, [dashboardData]);

  const welcomeTitle = useMemo(() => {
    if (!user) {
      return "Welcome";
    }

    return `Welcome, ${user.firstName} ${user.lastName}`;
  }, [user]);

  const welcomeSubtitle = useMemo(() => {
    if (roleTitle === "ADMIN") {
      return "Command-center overview for tenant operations with program-aware activity and inventory.";
    }

    return "Operational workspace scoped to the authenticated tenant and the currently selected program.";
  }, [roleTitle]);

  return (
    <section className="space-y-6">
      {/* Layout mejorado: Flexbox asegura que no se encimen los elementos */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch">
        <header className="flex-[1.4] flex flex-col justify-center space-y-2 rounded-2xl border border-slate-200/80 bg-white/75 px-6 py-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/65">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[2rem]">
            {welcomeTitle}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {welcomeSubtitle}
          </p>
        </header>

        <SurfaceCard className="flex-[0.9] w-full min-w-0 p-5 xl:min-w-80">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Tenant
              </p>
              <p className="mt-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {tenantName}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Program
              </p>
              <div className="mt-1.5">
                <CustomSelect
                  value={
                    currentProgramId !== null ? String(currentProgramId) : ""
                  }
                  disabled={isLoadingPrograms || programs.length === 0}
                  onChange={(val) => {
                    const id = Number(val);
                    if (Number.isFinite(id) && id > 0)
                      setCurrentProgramById(id);
                  }}
                  className="w-full"
                  placeholder={
                    isLoadingPrograms
                      ? "Loading programs…"
                      : "No programs available"
                  }
                  options={
                    isLoadingPrograms || programs.length === 0
                      ? []
                      : programs.map((p) => ({
                          value: String(p.id),
                          label: p.programName,
                        }))
                  }
                />
              </div>
              {programsError ? (
                <p className="mt-1 text-[11px] text-rose-500 dark:text-rose-400">
                  {programsError}
                </p>
              ) : null}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Role
              </p>
              <p className="mt-1.5 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {roleTitle}
              </p>
            </div>
          </div>
        </SurfaceCard>
      </div>

      {isLoading ? <DashboardLoadingState /> : null}

      {!isLoading && !currentProgram ? (
        <DashboardProgramSelectionState
          isLoadingPrograms={isLoadingPrograms}
          programsError={programsError}
        />
      ) : null}

      {!isLoading && currentProgram && errorMessage ? (
        <DashboardErrorState message={errorMessage} onRetry={handleRetry} />
      ) : null}

      {!isLoading && currentProgram && !errorMessage && !dashboardData ? (
        <DashboardErrorState
          message="Dashboard data is unavailable."
          onRetry={handleRetry}
        />
      ) : null}

      {!isLoading && currentProgram && !errorMessage && dashboardData ? (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Operational Metrics
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Scoped to tenant and selected program
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {metricItems.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  icon={metric.icon}
                  iconColor={metric.iconColor}
                  iconBg={metric.iconBg}
                />
              ))}
            </div>
          </section>

          <ActivityChart transactions={dashboardData.recentTransactions} />

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RecentTransactionsTable
              transactions={dashboardData.recentTransactions}
            />
            <RecentRedemptionsTable
              redemptions={dashboardData.recentRedemptions}
            />
          </section>

          <LowStockRewardsTable rewards={dashboardData.lowStockRewards} />
        </>
      ) : null}

      <DashboardQuickActions
        role={roleTitle}
        hasProgramConfigRoute={hasProgramConfigRoute}
      />
    </section>
  );
}
