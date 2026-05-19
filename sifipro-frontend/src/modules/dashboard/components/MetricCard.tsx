import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

type TrendDirection = "up" | "down" | "neutral";

type MetricCardTrend = {
  value: string;
  direction: TrendDirection;
  label?: string;
};

export type MetricCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: MetricCardTrend;
};

const trendColors: Record<TrendDirection, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  neutral: "text-slate-500 dark:text-slate-400",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
}: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900/75">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-300/60 to-transparent dark:via-slate-700/70" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={2} />
        </span>
      </div>

      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.03em] text-slate-900 dark:text-slate-50">
        {value}
      </p>

      {trend ? (
        <div className="mt-3 flex items-center gap-1.5">
          {trend.direction === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2.5} />
          ) : trend.direction === "down" ? (
            <TrendingDown className="h-3.5 w-3.5 text-rose-500" strokeWidth={2.5} />
          ) : null}
          <span className={`text-xs font-semibold ${trendColors[trend.direction]}`}>
            {trend.value}
          </span>
          {trend.label ? (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {trend.label}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 h-4" />
      )}
    </div>
  );
}
