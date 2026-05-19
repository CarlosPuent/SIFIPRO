import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { InlineAlert } from "../../components/ui/InlineAlert";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { formatNumber } from "../../lib/formatters";
import { useProgram } from "../program-config/ProgramContext";
import { ReportMetricCard } from "./components/ReportMetricCard";
import { TopCustomersReportTable } from "./components/TopCustomersReportTable";
import { TopRedeemedRewardsReportTable } from "./components/TopRedeemedRewardsReportTable";
import { getReportsData } from "./reports.service";
import type {
  ReportsScopeSummary,
  TopCustomerResponse,
  TopRedeemedRewardResponse,
} from "./reports.types";

type FeedbackState = {
  kind: "error";
  message: string;
} | null;

function buildMetricItems(summary: ReportsScopeSummary) {
  return [
    {
      label: "Customers in Tenant",
      value: formatNumber(summary.tenantCustomers),
    },
    {
      label: "Active Customers in Tenant",
      value: formatNumber(summary.tenantActiveCustomers),
    },
    {
      label: "Rewards in Program",
      value: formatNumber(summary.programRewards),
    },
    {
      label: "Active Rewards in Program",
      value: formatNumber(summary.programActiveRewards),
    },
    {
      label: "Transactions in Program",
      value: formatNumber(summary.programTransactions),
    },
    {
      label: "Redemptions in Program",
      value: formatNumber(summary.programRedemptions),
    },
    {
      label: "Points Issued in Program",
      value: formatNumber(summary.totalPointsIssuedInProgram),
    },
    {
      label: "Points Redeemed in Program",
      value: formatNumber(summary.totalPointsRedeemedInProgram),
    },
  ];
}

function ReportsLoadingState() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-52 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-lg max-w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="h-16 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
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

type ReportsErrorStateProps = {
  message: string;
  onRetry: () => void;
};

function ReportsErrorState({ message, onRetry }: ReportsErrorStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Failed to load reports
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-slate-500 dark:hover:bg-white"
      >
        Retry
      </button>
    </SurfaceCard>
  );
}

type ReportsProgramSelectionStateProps = {
  isLoadingPrograms: boolean;
  programsError: string | null;
};

function ReportsProgramSelectionState({
  isLoadingPrograms,
  programsError,
}: ReportsProgramSelectionStateProps) {
  return (
    <SurfaceCard className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {isLoadingPrograms ? "Loading programs" : "No program selected"}
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {isLoadingPrograms
          ? "Please wait while we resolve available programs for this tenant."
          : "Select a program from the header to load tenant and program-scoped reports."}
      </p>
      {programsError ? (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">
          {programsError}
        </p>
      ) : null}
    </SurfaceCard>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const { currentProgram, isLoadingPrograms, programsError } = useProgram();
  const currentProgramId = currentProgram?.id ?? null;

  const [summary, setSummary] = useState<ReportsScopeSummary | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomerResponse[]>([]);
  const [topRedeemedRewards, setTopRedeemedRewards] = useState<
    TopRedeemedRewardResponse[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const tenantName = user?.tenant.name ?? "Tenant unavailable";

  const loadReports = useCallback(
    async (options?: { showLoader?: boolean }) => {
      if (!currentProgramId) {
        setSummary(null);
        setTopCustomers([]);
        setTopRedeemedRewards([]);
        setLoadError(null);
        setFeedback(null);
        setLastUpdatedAt(null);
        setIsLoading(false);
        setIsRefreshing(false);
        return;
      }

      const showLoader = options?.showLoader ?? false;

      if (showLoader) {
        setIsLoading(true);
        setLoadError(null);
      } else {
        setIsRefreshing(true);
        setFeedback(null);
      }

      try {
        const reportsData = await getReportsData(currentProgramId);

        setSummary(reportsData.summary);
        setTopCustomers(reportsData.topCustomers);
        setTopRedeemedRewards(reportsData.topRedeemedRewards);
        setLastUpdatedAt(new Date());

        if (showLoader) {
          setLoadError(null);
        }
      } catch (error) {
        const message = extractErrorMessage(error);

        if (showLoader) {
          setLoadError(message);
        } else {
          setFeedback({
            kind: "error",
            message: `Could not refresh report data. ${message}`,
          });
        }
      } finally {
        if (showLoader) {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [currentProgramId],
  );

  useEffect(() => {
    void loadReports({ showLoader: true });
  }, [loadReports]);

  const metricItems = useMemo(() => {
    if (!summary) {
      return [];
    }

    return buildMetricItems(summary);
  }, [summary]);

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) {
      return "Not yet updated";
    }

    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(lastUpdatedAt);
  }, [lastUpdatedAt]);

  const handleRetry = () => {
    void loadReports({ showLoader: true });
  };

  const handleRefresh = () => {
    void loadReports();
  };

  if (!currentProgram && !isLoading) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Reports
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            Reports depend on the authenticated tenant and the currently
            selected program.
          </p>
        </header>

        <SurfaceCard className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Tenant
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                {tenantName}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Current Program
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                Select a program
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Customer totals are tenant-scoped. Ranking tables and operational
            metrics are generated for the selected program only.
          </p>
        </SurfaceCard>

        <ReportsProgramSelectionState
          isLoadingPrograms={isLoadingPrograms}
          programsError={programsError}
        />
      </section>
    );
  }

  if (isLoading) {
    return <ReportsLoadingState />;
  }

  if (loadError) {
    return <ReportsErrorState message={loadError} onRetry={handleRetry} />;
  }

  if (!summary) {
    return (
      <ReportsErrorState
        message="Report data is unavailable."
        onRetry={handleRetry}
      />
    );
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Reports
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Formal operational reporting snapshot for the authenticated tenant and
          the currently selected program.
        </p>
      </header>

      {feedback ? (
        <InlineAlert tone="error" message={feedback.message} />
      ) : null}

      <SurfaceCard className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Report Summary
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Last updated: {lastUpdatedLabel}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Tenant: {tenantName} · Program: {currentProgram?.programName}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-slate-500 dark:hover:bg-white"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </SurfaceCard>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Metrics Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricItems.map((metric) => (
            <ReportMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Ranking Reports
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Customer ranking is based on activity within the selected program and
          uses the tenant customer roster as reference.
        </p>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <TopCustomersReportTable customers={topCustomers} />
          <TopRedeemedRewardsReportTable rewards={topRedeemedRewards} />
        </div>
      </section>
    </section>
  );
}
