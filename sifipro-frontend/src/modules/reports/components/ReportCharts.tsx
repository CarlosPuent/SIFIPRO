import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { formatNumber } from "../../../lib/formatters";
import { useIsDark } from "../../../lib/useIsDark";
import { formatPeriodLabel } from "../report-dates";
import type {
  ReportGranularity,
  ReportTimeSeriesPoint,
  TierDistributionEntry,
} from "../reports.types";

function compactNumber(value: number): string {
  return Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
}

function useChartColors() {
  const isDark = useIsDark();
  const text = isDark ? "#e2e8f0" : "#0f172a";
  return {
    grid: isDark ? "#1e293b" : "#f1f5f9",
    axis: isDark ? "#64748b" : "#94a3b8",
    tooltip: {
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      border: `1px solid ${isDark ? "#1e293b" : "#e2e8f0"}`,
      borderRadius: 12,
      fontSize: 12,
      color: text,
    },
    // Explicit text colors: by default Recharts paints tooltip items with the series
    // color, which is unreadable for the tier bars on a dark tooltip.
    tooltipLabel: { color: text, fontWeight: 600 },
    tooltipItem: { color: text },
    // Replaces Recharts' default light-gray hover block behind the bars.
    barCursor: { fill: isDark ? "rgba(148,163,184,0.08)" : "rgba(99,102,241,0.06)" },
    lineCursor: { stroke: isDark ? "#334155" : "#cbd5e1", strokeWidth: 1 },
  };
}

function ChartCard({
  title,
  description,
  isEmpty,
  children,
}: {
  title: string;
  description: string;
  isEmpty: boolean;
  children: ReactNode;
}) {
  return (
    <SurfaceCard className="p-0">
      <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {isEmpty ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No activity in the selected period.
        </p>
      ) : (
        <div className="px-2 py-5">{children}</div>
      )}
    </SurfaceCard>
  );
}

type TimeSeriesChartProps = {
  series: ReportTimeSeriesPoint[];
  granularity: ReportGranularity;
};

function hasActivity(series: ReportTimeSeriesPoint[]): boolean {
  return series.some((point) => point.purchases > 0 || point.redemptions > 0);
}

export function SalesChart({ series, granularity }: TimeSeriesChartProps) {
  const colors = useChartColors();
  const data = series.map((point) => ({
    label: formatPeriodLabel(point.period, granularity),
    amount: Number(point.amount),
    purchases: point.purchases,
  }));

  return (
    <ChartCard
      title="Sales"
      description={`Purchase amount per ${granularity === "MONTH" ? "month" : "day"}.`}
      isEmpty={!hasActivity(series)}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 11 }} minTickGap={12} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 11 }} width={48} tickFormatter={compactNumber} />
          <Tooltip
            contentStyle={colors.tooltip}
            labelStyle={colors.tooltipLabel}
            itemStyle={colors.tooltipItem}
            cursor={colors.barCursor}
            formatter={(value, name) =>
              name === "amount" ? [`$${formatNumber(Number(value), 2)}`, "Amount"] : [String(value), String(name)]
            }
          />
          <Bar dataKey="amount" name="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PointsChart({ series, granularity }: TimeSeriesChartProps) {
  const colors = useChartColors();
  const data = series.map((point) => ({
    label: formatPeriodLabel(point.period, granularity),
    issued: Number(point.pointsIssued),
    redeemed: Number(point.pointsRedeemed),
  }));

  return (
    <ChartCard
      title="Points Issued vs Redeemed"
      description={`Points earned by purchases and consumed by redemptions per ${granularity === "MONTH" ? "month" : "day"}.`}
      isEmpty={!hasActivity(series)}
    >
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 11 }} minTickGap={12} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 11 }} width={48} tickFormatter={compactNumber} />
          <Tooltip
            contentStyle={colors.tooltip}
            labelStyle={colors.tooltipLabel}
            itemStyle={colors.tooltipItem}
            cursor={colors.lineCursor}
            formatter={(value, name) => [formatNumber(Number(value), 2), name === "issued" ? "Issued" : "Redeemed"]}
          />
          <Legend
            formatter={(value) => (value === "issued" ? "Issued" : "Redeemed")}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Area type="monotone" dataKey="issued" name="issued" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="redeemed" name="redeemed" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

const TIER_COLORS: Record<string, string> = {
  BRONZE: "#d97706",
  SILVER: "#94a3b8",
  GOLD: "#eab308",
};

export function TierDistributionChart({ tiers }: { tiers: TierDistributionEntry[] }) {
  const colors = useChartColors();
  const data = tiers.map((entry) => ({
    tier: entry.tier.charAt(0) + entry.tier.slice(1).toLowerCase(),
    key: entry.tier,
    customers: entry.customers,
  }));

  return (
    <ChartCard
      title="Customers by Tier"
      description="Whole tenant, by current balance (Bronze < 500 ≤ Silver < 2,000 ≤ Gold). Not affected by the period."
      isEmpty={tiers.every((entry) => entry.customers === 0)}
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis dataKey="tier" axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 11 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: colors.axis, fontSize: 11 }} width={32} />
          <Tooltip
            contentStyle={colors.tooltip}
            labelStyle={colors.tooltipLabel}
            itemStyle={colors.tooltipItem}
            cursor={colors.barCursor}
            formatter={(value) => [String(value), "Customers"]}
          />
          <Bar dataKey="customers" radius={[4, 4, 0, 0]} maxBarSize={56}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={TIER_COLORS[entry.key] ?? "#94a3b8"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
