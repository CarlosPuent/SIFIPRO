import {
  fallbackText,
  formatDateTime,
  formatNumber,
} from "../../../lib/formatters";
import type { CustomerProfileResponse } from "../customer-profile.types";

type TierKey = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

const TIER_THRESHOLDS: {
  key: TierKey;
  label: string;
  min: number;
  nextThreshold: number | null;
  nextLabel: string | null;
}[] = [
  {
    key: "BRONZE",
    label: "Bronze",
    min: 0,
    nextThreshold: 5000,
    nextLabel: "Silver",
  },
  {
    key: "SILVER",
    label: "Silver",
    min: 5000,
    nextThreshold: 15000,
    nextLabel: "Gold",
  },
  {
    key: "GOLD",
    label: "Gold",
    min: 15000,
    nextThreshold: 30000,
    nextLabel: "Platinum",
  },
  {
    key: "PLATINUM",
    label: "Platinum",
    min: 30000,
    nextThreshold: null,
    nextLabel: null,
  },
];

const TIER_BADGE_STYLES: Record<TierKey, string> = {
  BRONZE:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-300",
  SILVER:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  GOLD: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800/50 dark:bg-yellow-950/50 dark:text-yellow-300",
  PLATINUM:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800/50 dark:bg-violet-950/50 dark:text-violet-300",
};

const TIER_PROGRESS_COLORS: Record<TierKey, string> = {
  BRONZE: "from-amber-400 to-amber-500",
  SILVER: "from-slate-400 to-slate-500",
  GOLD: "from-yellow-400 to-amber-500",
  PLATINUM: "from-violet-500 to-indigo-600",
};

function toNum(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

function computeTierInfo(points: number) {
  const tier =
    TIER_THRESHOLDS.slice()
      .reverse()
      .find((t) => points >= t.min) ?? TIER_THRESHOLDS[0];

  const progress =
    tier.nextThreshold === null
      ? 100
      : Math.min(
          100,
          ((points - tier.min) / (tier.nextThreshold - tier.min)) * 100,
        );

  const pointsToNext =
    tier.nextThreshold !== null
      ? Math.max(0, tier.nextThreshold - points)
      : null;

  return { tier, progress, pointsToNext };
}

type CustomerProfileHeaderProps = {
  profile: CustomerProfileResponse;
};

export function CustomerProfileHeader({ profile }: CustomerProfileHeaderProps) {
  const points = toNum(profile.pointsBalance);
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  const apiTierKey = (profile.tier?.toUpperCase() ?? "") as TierKey;
  const tierKey: TierKey = TIER_THRESHOLDS.some((t) => t.key === apiTierKey)
    ? apiTierKey
    : computeTierInfo(points).tier.key;

  const { tier, progress, pointsToNext } = computeTierInfo(points);
  const resolvedTier = TIER_THRESHOLDS.find((t) => t.key === tierKey) ?? tier;

  const badgeStyle = TIER_BADGE_STYLES[tierKey];
  const progressColor = TIER_PROGRESS_COLORS[tierKey];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900/75">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-indigo-400/40 to-transparent dark:via-indigo-500/30" />

      <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-lg">
              {initials}
            </div>
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                {profile.firstName} {profile.lastName}
              </h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] ${badgeStyle}`}
              >
                {resolvedTier.label}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  profile.active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {profile.active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {profile.email}
              </p>
              {profile.phone ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {profile.phone}
                </p>
              ) : null}
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Member since {fallbackText(formatDateTime(profile.createdAt))}
              </p>
            </div>

            {/* Points balance */}
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
                  {formatNumber(points, 0)}
                </p>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  pts balance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier progress */}
        <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {resolvedTier.label} Tier
              </span>
              {resolvedTier.nextLabel ? (
                <>
                  <span className="text-xs text-slate-300 dark:text-slate-600">
                    →
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {resolvedTier.nextLabel}
                  </span>
                </>
              ) : null}
            </div>
            {pointsToNext !== null && resolvedTier.nextLabel ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatNumber(pointsToNext, 0)} pts
                </span>{" "}
                to {resolvedTier.nextLabel}
              </p>
            ) : (
              <p className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                Maximum tier reached
              </p>
            )}
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
            <div
              className={`h-full rounded-full bg-linear-to-r transition-all duration-700 ${progressColor}`}
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>

          {resolvedTier.nextThreshold !== null ? (
            <div className="mt-1.5 flex justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-600">
                {formatNumber(resolvedTier.min, 0)}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-600">
                {formatNumber(resolvedTier.nextThreshold, 0)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
