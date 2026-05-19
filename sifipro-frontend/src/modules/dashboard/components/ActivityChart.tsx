import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardTransactionResponse } from "../dashboard.types";

type ActivityChartProps = {
  transactions: DashboardTransactionResponse[];
};

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
    return () => {
      observer.disconnect();
    };
  }, []);

  return isDark;
}

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].slice(0, 10);
  }
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function toNumber(value: number | string): number {
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

type ChartDatum = {
  name: string;
  points: number;
  amount: number;
};

function buildChartData(
  transactions: DashboardTransactionResponse[],
): ChartDatum[] {
  return transactions.map((tx) => ({
    name: abbreviateName(tx.customerFullName),
    points: toNumber(tx.pointsEarned),
    amount: toNumber(tx.amount),
  }));
}

type CustomTooltipProps = {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  isDark: boolean;
};

function CustomTooltip({ active, payload, label, isDark }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const bg = isDark ? "#0f172a" : "#ffffff";
  const border = isDark ? "#1e293b" : "#e2e8f0";
  const text = isDark ? "#e2e8f0" : "#0f172a";
  const muted = isDark ? "#64748b" : "#94a3b8";

  return (
    <div
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      }}
    >
      <p style={{ color: muted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: text, fontSize: 13, fontWeight: 600, margin: "2px 0" }}>
          {entry.name === "points" ? "Points Earned" : "Purchase Amount"}:{" "}
          <span style={{ color: entry.name === "points" ? "#6366f1" : "#10b981" }}>
            {entry.name === "points"
              ? entry.value.toLocaleString()
              : `$${entry.value.toLocaleString()}`}
          </span>
        </p>
      ))}
    </div>
  );
}

export function ActivityChart({ transactions }: ActivityChartProps) {
  const isDark = useIsDark();
  const data = buildChartData(transactions);

  const gridColor = isDark ? "#1e293b" : "#f1f5f9";
  const axisTickColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <div
      className="rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900/75"
    >
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Recent Transaction Activity
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Points earned and purchase amounts from the last transactions
          </p>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Latest {data.length}
        </span>
      </div>

      {data.length === 0 ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No transaction data available for the selected program.
        </p>
      ) : (
        <div className="px-2 py-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              barCategoryGap="32%"
              barGap={4}
            >
              <CartesianGrid
                vertical={false}
                stroke={gridColor}
                strokeDasharray="0"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11, fontWeight: 500 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: axisTickColor, fontSize: 11 }}
                width={44}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                }
              />
              <Tooltip
                content={<CustomTooltip isDark={isDark} />}
                cursor={{ fill: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)", radius: 6 }}
              />
              <Bar
                dataKey="points"
                name="points"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="amount"
                name="amount"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 flex items-center justify-center gap-5 px-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Points Earned
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Purchase Amount ($)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
