import { getTodayDateInputValue } from "../../lib/date-utils";
import type { ReportGranularity, ReportRange } from "./reports.types";

export type ReportPreset = "last7" | "last30" | "thisMonth" | "last4Months" | "custom";

export const REPORT_PRESETS: { key: ReportPreset; label: string }[] = [
  { key: "last7", label: "Last 7 days" },
  { key: "last30", label: "Last 30 days" },
  { key: "thisMonth", label: "This month" },
  { key: "last4Months", label: "Last 4 months" },
  { key: "custom", label: "Custom range" },
];

// Default: the current month plus the three before it (covers the seeded demo data).
export const DEFAULT_REPORT_PRESET: ReportPreset = "last4Months";

function daysAgo(today: Date, days: number): Date {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date;
}

/** Inclusive date range of a preset, in local time. "custom" falls back to the last 30 days. */
export function presetRange(preset: ReportPreset, today = new Date()): ReportRange {
  const to = getTodayDateInputValue(today);

  switch (preset) {
    case "last7":
      return { from: getTodayDateInputValue(daysAgo(today, 6)), to };
    case "thisMonth":
      return { from: getTodayDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    case "last4Months":
      return { from: getTodayDateInputValue(new Date(today.getFullYear(), today.getMonth() - 3, 1)), to };
    case "last30":
    case "custom":
    default:
      return { from: getTodayDateInputValue(daysAgo(today, 29)), to };
  }
}

/** Daily buckets up to ~2 months, monthly beyond that. */
export function defaultGranularity(range: ReportRange): ReportGranularity {
  const days = (Date.parse(range.to) - Date.parse(range.from)) / 86_400_000;
  return days > 62 ? "MONTH" : "DAY";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-07-01" -> "Jul 2026" (MONTH) or "Jul 1" (DAY). Parsed manually to avoid UTC shifts. */
export function formatPeriodLabel(period: string, granularity: ReportGranularity): string {
  const [year, month, day] = period.split("-").map(Number);
  const monthName = MONTHS[(month ?? 1) - 1] ?? "";
  return granularity === "MONTH" ? `${monthName} ${year}` : `${monthName} ${day}`;
}
