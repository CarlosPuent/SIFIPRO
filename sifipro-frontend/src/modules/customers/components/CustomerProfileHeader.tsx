import {
  fallbackText,
  formatDateTime,
  formatNumber,
} from "../../../lib/formatters";
import type { CustomerProfileResponse } from "../customer-profile.types";

// Presentation only. Which tier a customer is in, the next tier, the points left and
// the progress all come from the backend (CustomerTier.java via tierProgress);
// nothing here computes tiers. GOLD is the highest tier.
const TIER_BADGE_STYLES: Record<string, string> = {
  BRONZE:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/50 dark:text-amber-300",
  SILVER:
    "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  GOLD: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800/50 dark:bg-yellow-950/50 dark:text-yellow-300",
};

const TIER_PROGRESS_COLORS: Record<string, string> = {
  BRONZE: "from-amber-400 to-amber-500",
  SILVER: "from-slate-400 to-slate-500",
  GOLD: "from-yellow-400 to-amber-500",
};

const DEFAULT_BADGE_STYLE =
  "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
const DEFAULT_PROGRESS_COLOR = "from-slate-400 to-slate-500";

function toNum(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

// "GOLD" -> "Gold"
function formatTierLabel(tier: string | null | undefined): string {
  if (!tier) return "-";
  const lower = tier.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

type CustomerProfileHeaderProps = {
  profile: CustomerProfileResponse;
};

export function CustomerProfileHeader({ profile }: CustomerProfileHeaderProps) {
  const points = toNum(profile.pointsBalance);
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();

  const tierProgress = profile.tierProgress;
  const tierKey = (tierProgress?.currentTier ?? profile.tier ?? "").toUpperCase();
  const tierLabel = formatTierLabel(tierKey);
  const nextTierLabel = tierProgress?.nextTier ? formatTierLabel(tierProgress.nextTier) : null;
  const pointsToNext = toNum(tierProgress?.pointsToNextTier);
  const pointsForNextTier =
    tierProgress?.pointsForNextTier != null ? toNum(tierProgress.pointsForNextTier) : null;
  const progress = Math.min(100, Math.max(0, toNum(tierProgress?.progressPercentage)));

  const badgeStyle = TIER_BADGE_STYLES[tierKey] ?? DEFAULT_BADGE_STYLE;
  const progressColor = TIER_PROGRESS_COLORS[tierKey] ?? DEFAULT_PROGRESS_COLOR;

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
                {tierLabel}
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
                {/* ✅ Fix: usa memberSince que es lo que devuelve el backend */}
                Member since {fallbackText(formatDateTime(profile.memberSince))}
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

        {/* Tier progress (values from the backend's tierProgress) */}
        <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-slate-800/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {tierLabel} Tier
              </span>
              {nextTierLabel ? (
                <>
                  <span className="text-xs text-slate-300 dark:text-slate-600">
                    →
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {nextTierLabel}
                  </span>
                </>
              ) : null}
            </div>
            {nextTierLabel ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatNumber(pointsToNext, 0)} pts
                </span>{" "}
                to {nextTierLabel}
              </p>
            ) : (
              <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                Highest tier reached
              </p>
            )}
          </div>

          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
            <div
              className={`h-full rounded-full bg-linear-to-r transition-all duration-700 ${progressColor}`}
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>

          <div className="mt-1.5 flex justify-between">
            <span className="text-[11px] text-slate-400 dark:text-slate-600">
              {formatNumber(progress, 0)}% of the way
            </span>
            {nextTierLabel && pointsForNextTier !== null ? (
              <span className="text-[11px] text-slate-400 dark:text-slate-600">
                {nextTierLabel} at {formatNumber(pointsForNextTier, 0)} pts
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
