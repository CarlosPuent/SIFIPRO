import axios from "axios";
import { apiClient } from "../../lib/api-client";
import type {
  RecentActivity,
  ReportGranularity,
  ReportRange,
  ReportsData,
  ReportSummary,
  ReportTimeSeriesPoint,
  StockAlertEntry,
  TierDistributionEntry,
  TopCustomerReportEntry,
  TopRewardReportEntry,
} from "./reports.types";

// All aggregation happens in tenant-api (GET /api/reports/**), always scoped to the
// authenticated user's tenant; the browser only renders the results.

type ScopeParams = {
  programConfigId: number;
  from?: string;
  to?: string;
};

function scopeParams(programConfigId: number, range?: ReportRange): ScopeParams {
  return range ? { programConfigId, from: range.from, to: range.to } : { programConfigId };
}

export async function getReportSummary(
  programConfigId: number,
  range?: ReportRange,
): Promise<ReportSummary> {
  const response = await apiClient.get<ReportSummary>("/api/reports/summary", {
    params: scopeParams(programConfigId, range),
  });
  return response.data;
}

export async function getRecentActivity(
  programConfigId: number,
  limit: number,
): Promise<RecentActivity> {
  const response = await apiClient.get<RecentActivity>("/api/reports/recent-activity", {
    params: { programConfigId, limit },
  });
  return response.data;
}

export async function getStockAlerts(
  programConfigId: number,
  threshold: number,
  limit: number,
): Promise<StockAlertEntry[]> {
  const response = await apiClient.get<StockAlertEntry[]>("/api/reports/stock-alerts", {
    params: { programConfigId, threshold, limit },
  });
  return response.data;
}

export async function getReportsData(
  programConfigId: number,
  range: ReportRange,
  granularity: ReportGranularity,
): Promise<ReportsData> {
  const params = scopeParams(programConfigId, range);

  const [summary, timeSeries, topCustomers, topRewards, tierDistribution, stockAlerts] =
    await Promise.all([
      getReportSummary(programConfigId, range),
      apiClient.get<ReportTimeSeriesPoint[]>("/api/reports/timeseries", {
        params: { ...params, granularity },
      }),
      apiClient.get<TopCustomerReportEntry[]>("/api/reports/top-customers", {
        params: { ...params, limit: 10 },
      }),
      apiClient.get<TopRewardReportEntry[]>("/api/reports/top-rewards", {
        params: { ...params, limit: 10 },
      }),
      apiClient.get<TierDistributionEntry[]>("/api/reports/tier-distribution"),
      getStockAlerts(programConfigId, 5, 10),
    ]);

  return {
    summary,
    timeSeries: timeSeries.data,
    topCustomers: topCustomers.data,
    topRewards: topRewards.data,
    tierDistribution: tierDistribution.data,
    stockAlerts,
  };
}

// "report" is the formal PDF report (Avance final); the others are CSV exports.
export type CsvExportKind = "summary" | "purchases" | "report";

function fileNameFromDisposition(header: unknown, fallback: string): string {
  if (typeof header !== "string") return fallback;
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1] : fallback;
}

// With responseType "blob" an error body also arrives as a Blob; turn it back into
// the API's JSON error so extractErrorMessage can show its message.
async function unwrapBlobError(error: unknown): Promise<unknown> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text());
    } catch {
      // not JSON: keep the original error
    }
  }
  return error;
}

/** Downloads a CSV export (same scope rules as the reports) and saves it as a file. */
export async function downloadReportCsv(
  kind: CsvExportKind,
  programConfigId: number,
  range: ReportRange,
): Promise<void> {
  try {
    const extension = kind === "report" ? "pdf" : "csv";
    const response = await apiClient.get<Blob>(`/api/reports/export/${kind}.${extension}`, {
      params: scopeParams(programConfigId, range),
      responseType: "blob",
      // Rendering the PDF aggregates several reports; allow more than the default 10 s.
      timeout: 30000,
    });

    const fileName = fileNameFromDisposition(
      response.headers["content-disposition"],
      `sifipro-${kind}.${extension}`,
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    throw await unwrapBlobError(error);
  }
}
