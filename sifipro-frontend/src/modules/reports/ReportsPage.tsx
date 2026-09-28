import { Download, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../auth/useAuth";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { DateField } from "../../components/ui/form";
import { extractErrorMessage } from "../../lib/error-utils";
import { formatInteger, formatNumber, formatPoints } from "../../lib/formatters";
import { useProgram } from "../program-config/useProgram";
import { PointsChart, SalesChart, TierDistributionChart } from "./components/ReportCharts";
import { ReportMetricCard } from "./components/ReportMetricCard";
import { StockAlertsReportTable } from "./components/StockAlertsReportTable";
import { TopCustomersReportTable } from "./components/TopCustomersReportTable";
import { TopRedeemedRewardsReportTable } from "./components/TopRedeemedRewardsReportTable";
import {
  DEFAULT_REPORT_PRESET,
  REPORT_PRESETS,
  defaultGranularity,
  presetRange,
  type ReportPreset,
} from "./report-dates";
import { downloadReportCsv, getReportsData, type CsvExportKind } from "./reports.service";
import type { ReportGranularity, ReportRange, ReportsData } from "./reports.types";

const INITIAL_RANGE = presetRange(DEFAULT_REPORT_PRESET);

function buildMetricItems(data: ReportsData) {
  const { summary } = data;
  return [
    { label: "Purchases", value: formatInteger(summary.purchases) },
    { label: "Sales Amount", value: `$${formatNumber(summary.totalAmount, 2)}` },
    { label: "Points Issued", value: formatPoints(summary.pointsIssued) },
    { label: "Points Redeemed", value: formatPoints(summary.pointsRedeemed) },
    { label: "Redemptions", value: formatInteger(summary.redemptions) },
    {
      label: "Purchasing Customers",
      value: formatInteger(summary.purchasingCustomers),
      hint: "With at least one purchase in the period",
    },
    {
      label: "New Customers",
      value: formatInteger(summary.newCustomers),
      hint: "Registered in the period (whole tenant)",
    },
    {
      label: "Active Customers",
      value: formatInteger(summary.activeCustomers),
      hint: `Of ${formatInteger(summary.totalCustomers)} in the tenant`,
    },
  ];
}

function ReportsLoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
        <div className="h-80 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
      </div>
    </div>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const { currentProgram, isLoadingPrograms, programsError } = useProgram();
  const currentProgramId = currentProgram?.id ?? null;
  const tenantName = user?.tenant.name ?? "Tenant unavailable";

  const [preset, setPreset] = useState<ReportPreset>(DEFAULT_REPORT_PRESET);
  const [range, setRange] = useState<ReportRange>(INITIAL_RANGE);
  const [customDraft, setCustomDraft] = useState<ReportRange>(INITIAL_RANGE);
  const [granularity, setGranularity] = useState<ReportGranularity>(
    defaultGranularity(INITIAL_RANGE),
  );
  const [refreshToken, setRefreshToken] = useState(0);

  const [data, setData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<CsvExportKind | null>(null);

  // Any change of program, period, bucket size or a manual refresh starts a new load.
  // The reset happens during render (React's "adjusting state when a prop changes"
  // pattern); the effect below only applies the async result.
  const requestKey =
    currentProgramId === null
      ? null
      : `${currentProgramId}|${range.from}|${range.to}|${granularity}|${refreshToken}`;
  const [loadedKey, setLoadedKey] = useState<string | null | undefined>(undefined);
  if (loadedKey !== requestKey) {
    setLoadedKey(requestKey);
    setLoadError(null);
    setIsLoading(requestKey !== null);
  }

  useEffect(() => {
    if (currentProgramId === null) {
      return;
    }

    let isActive = true;

    getReportsData(currentProgramId, range, granularity)
      .then((reportsData) => {
        if (isActive) setData(reportsData);
      })
      .catch((error: unknown) => {
        if (isActive) setLoadError(extractErrorMessage(error, "Could not load reports."));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [currentProgramId, range, granularity, refreshToken]);

  const applyPreset = (nextPreset: ReportPreset) => {
    setPreset(nextPreset);
    if (nextPreset === "custom") {
      setCustomDraft(range);
      return;
    }
    const nextRange = presetRange(nextPreset);
    setRange(nextRange);
    setGranularity(defaultGranularity(nextRange));
  };

  const customRangeError =
    customDraft.from && customDraft.to && customDraft.from > customDraft.to
      ? "The start date must be on or before the end date."
      : null;

  const applyCustomRange = () => {
    if (!customDraft.from || !customDraft.to || customRangeError) {
      return;
    }
    setRange(customDraft);
    setGranularity(defaultGranularity(customDraft));
  };

  const handleExport = async (kind: CsvExportKind) => {
    if (currentProgramId === null) return;
    setExporting(kind);
    try {
      await downloadReportCsv(kind, currentProgramId, range);
      toast.success(kind === "summary" ? "Summary CSV downloaded." : "Purchases CSV downloaded.");
    } catch (error) {
      toast.error(`Could not export CSV. ${extractErrorMessage(error)}`);
    } finally {
      setExporting(null);
    }
  };

  if (!currentProgram) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Reports
          </h1>
        </header>
        <SurfaceCard className="p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isLoadingPrograms ? "Loading programs" : "No program selected"}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {isLoadingPrograms
              ? "Please wait while we resolve available programs for this tenant."
              : "Select a program on the Dashboard to load tenant and program-scoped reports."}
          </p>
          {programsError ? (
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{programsError}</p>
          ) : null}
        </SurfaceCard>
      </section>
    );
  }

  const metricItems = data ? buildMetricItems(data) : [];

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Reports
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Tenant: {tenantName} · Program: {currentProgram.programName}. Figures are
          computed by the server for this tenant only.
        </p>
      </header>

      {/* ── Filters ─────────────────────────────── */}
      <SurfaceCard className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {REPORT_PRESETS.map((option) => (
            <Button
              key={option.key}
              size="sm"
              variant={preset === option.key ? "primary" : "secondary"}
              onClick={() => applyPreset(option.key)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {preset === "custom" ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              From
              <DateField
                className="mt-1"
                value={customDraft.from}
                max={customDraft.to || undefined}
                onChange={(event) => setCustomDraft((current) => ({ ...current, from: event.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              To
              <DateField
                className="mt-1"
                value={customDraft.to}
                min={customDraft.from || undefined}
                onChange={(event) => setCustomDraft((current) => ({ ...current, to: event.target.value }))}
              />
            </label>
            <Button
              variant="primary"
              size="sm"
              disabled={!customDraft.from || !customDraft.to || Boolean(customRangeError)}
              onClick={applyCustomRange}
            >
              Apply
            </Button>
            {customRangeError ? (
              <p className="text-xs text-rose-600 dark:text-rose-400">{customRangeError}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Period: <span className="font-semibold text-slate-700 dark:text-slate-200">{range.from}</span> to{" "}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{range.to}</span>
            </span>
            <span className="inline-flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              {(["DAY", "MONTH"] as ReportGranularity[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setGranularity(option)}
                  className={`px-2.5 py-1 font-semibold transition ${
                    granularity === option
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {option === "DAY" ? "By day" : "By month"}
                </button>
              ))}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              disabled={isLoading}
              onClick={() => setRefreshToken((token) => token + 1)}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              isLoading={exporting === "summary"}
              disabled={exporting !== null}
              onClick={() => void handleExport("summary")}
            >
              Export summary CSV
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              isLoading={exporting === "purchases"}
              disabled={exporting !== null}
              onClick={() => void handleExport("purchases")}
            >
              Export purchases CSV
            </Button>
          </div>
        </div>
      </SurfaceCard>

      {isLoading ? (
        <ReportsLoadingState />
      ) : loadError || !data ? (
        <SurfaceCard className="p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Failed to load reports
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {loadError ?? "Report data is unavailable."}
          </p>
          <Button className="mt-5" onClick={() => setRefreshToken((token) => token + 1)}>
            Retry
          </Button>
        </SurfaceCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metricItems.map((metric) => (
              <ReportMetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SalesChart series={data.timeSeries} granularity={granularity} />
            <PointsChart series={data.timeSeries} granularity={granularity} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TopCustomersReportTable customers={data.topCustomers} />
            <TopRedeemedRewardsReportTable rewards={data.topRewards} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TierDistributionChart tiers={data.tierDistribution} />
            <StockAlertsReportTable alerts={data.stockAlerts} />
          </div>
        </>
      )}
    </section>
  );
}
