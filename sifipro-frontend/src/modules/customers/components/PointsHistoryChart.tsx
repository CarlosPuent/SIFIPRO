import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PointsHistoryEntry } from "../customer-profile.types";

function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function toNum(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatChartDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

type ChartDatum = {
  label: string;
  balance: number;
  earned: number;
};

function buildChartData(history: PointsHistoryEntry[]): ChartDatum[] {
  return history
    .filter((e) => Boolean(e.date))
    .map((e) => ({
      label: formatChartDate(e.date),
      balance: toNum(e.balance ?? e.cumulativeBalance),
      earned: toNum(e.pointsEarned),
    }));
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  isDark: boolean;
  seriesLabel: string;
};

function CustomTooltip({
  active,
  payload,
  label,
  isDark,
  seriesLabel,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      <p
        style={{
          color: isDark ? "#64748b" : "#94a3b8",
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          style={{
            color: isDark ? "#e2e8f0" : "#0f172a",
            fontSize: 14,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {seriesLabel}:{" "}
          <span style={{ color: "#6366f1" }}>
            {entry.value.toLocaleString()} pts
          </span>
        </p>
      ))}
    </div>
  );
}

type PointsHistoryChartProps = {
  history: PointsHistoryEntry[];
};

export function PointsHistoryChart({ history }: PointsHistoryChartProps) {
  const isDark = useIsDark();
  const data = buildChartData(history);

  const hasBalance = data.some((d) => d.balance > 0);
  const seriesKey = hasBalance ? "balance" : "earned";
  const seriesLabel = hasBalance ? "Balance" : "Points Earned";

  const gridColor = isDark ? "#1e293b" : "#f1f5f9";
  const axisColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900/75">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Points History
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {seriesLabel.toLowerCase()} trend over time
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          {seriesLabel}
        </span>
      </div>

      {data.length === 0 ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No points history available.
        </p>
      ) : (
        <div className="px-2 py-5">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={data}
              margin={{ top: 8, right: 16, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id="pointsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#6366f1"
                    stopOpacity={isDark ? 0.22 : 0.18}
                  />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke={gridColor}
                strokeDasharray="0"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisColor, fontSize: 11 }}
                width={50}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
              <Tooltip
                content={
                  <CustomTooltip isDark={isDark} seriesLabel={seriesLabel} />
                }
                cursor={{
                  stroke: isDark ? "#4f46e5" : "#818cf8",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey={seriesKey}
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#pointsGrad)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#6366f1",
                  stroke: isDark ? "#1e1b4b" : "#e0e7ff",
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
