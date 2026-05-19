import {
  ArrowLeftRight,
  Gift,
  ShoppingBag,
  TrendingUp,
} from "lucide-react";
import { formatNumber } from "../../../lib/formatters";
import type { CustomerProfileResponse } from "../customer-profile.types";

function toNum(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveValue(value: number | null): string {
  return value === null ? "—" : formatNumber(value, 0);
}

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
};

function StatCard({ label, value, icon, iconBg }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900/75">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-300/60 to-transparent dark:via-slate-700/60" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[2rem] font-semibold leading-none tracking-[-0.03em] text-slate-900 dark:text-slate-50">
        {value}
      </p>
    </div>
  );
}

type CustomerStatCardsProps = {
  profile: CustomerProfileResponse;
};

export function CustomerStatCards({ profile }: CustomerStatCardsProps) {
  const totalTx = toNum(profile.totalTransactions);
  const totalRd = toNum(profile.totalRedemptions);
  const lifetimeEarned = toNum(
    profile.lifetimePointsEarned ?? profile.totalPointsEarned,
  );
  const lifetimeRedeemed = toNum(
    profile.lifetimePointsRedeemed ?? profile.totalPointsRedeemed,
  );

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        label="Transactions"
        value={resolveValue(totalTx)}
        iconBg="bg-indigo-50 dark:bg-indigo-950/50"
        icon={
          <ArrowLeftRight
            className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
            strokeWidth={2}
          />
        }
      />
      <StatCard
        label="Redemptions"
        value={resolveValue(totalRd)}
        iconBg="bg-amber-50 dark:bg-amber-950/50"
        icon={
          <ShoppingBag
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
            strokeWidth={2}
          />
        }
      />
      <StatCard
        label="Lifetime Earned"
        value={resolveValue(lifetimeEarned)}
        iconBg="bg-emerald-50 dark:bg-emerald-950/50"
        icon={
          <TrendingUp
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            strokeWidth={2}
          />
        }
      />
      <StatCard
        label="Lifetime Redeemed"
        value={resolveValue(lifetimeRedeemed)}
        iconBg="bg-rose-50 dark:bg-rose-950/50"
        icon={
          <Gift
            className="h-4 w-4 text-rose-600 dark:text-rose-400"
            strokeWidth={2}
          />
        }
      />
    </div>
  );
}
