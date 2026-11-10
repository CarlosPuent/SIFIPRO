import axios from "axios";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Gift,
  History,
  LogOut,
  Sparkles,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ThemeToggle } from "../../components/ui/ThemeToggle";
import { extractErrorMessage } from "../../lib/error-utils";
import { formatDateTime, formatPoints } from "../../lib/formatters";
import { applyTheme, getInitialTheme, persistTheme, type Theme } from "../../lib/theme";
import {
  clearPortalToken,
  getPortalMovements,
  getPortalProfile,
  getPortalRewards,
  getPortalToken,
} from "./portal.service";
import type { PortalMovement, PortalProfile, PortalReward } from "./portal.types";

const TIER_BADGE: Record<string, string> = {
  GOLD: "bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/40",
  SILVER: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-500/15 dark:text-slate-200 dark:ring-slate-500/40",
  BRONZE: "bg-orange-100 text-orange-800 ring-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/40",
};

const MOVEMENT_LABEL: Record<PortalMovement["type"], string> = {
  EARN: "Earned",
  REDEEM: "Redeemed",
  ADJUSTMENT: "Adjustment",
  EXPIRE: "Expired",
};

const panel =
  "rounded-[1.25rem] border border-slate-200/70 bg-white/95 shadow-[0_4px_24px_rgba(15,23,42,0.03)] dark:border-white/[0.06] dark:bg-slate-900/80";

type RewardFilter = "available" | "all";

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className={`${panel} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</div>
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}

function RewardCard({ reward }: { reward: PortalReward }) {
  const required = Number(reward.requiredPoints);
  const balance = Number(reward.programBalance);
  const progress = required > 0 ? Math.min(100, (balance / required) * 100) : 100;
  const outOfStock = reward.stock <= 0;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border transition ${reward.available
        ? "border-emerald-300/80 bg-emerald-50/40 dark:border-emerald-600/40 dark:bg-emerald-950/15"
        : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/50"}`}
    >
      <div className="relative h-28 bg-gradient-to-br from-indigo-500/90 via-violet-500/80 to-fuchsia-500/70">
        {reward.imageUrl ? (
          <img src={reward.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gift className="h-9 w-9 text-white/90" strokeWidth={1.6} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur">
          {reward.programName}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="font-semibold text-slate-900 dark:text-slate-100">{reward.name}</p>
        {reward.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{reward.description}</p>
        ) : null}
        <div className="mt-auto pt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{formatPoints(reward.requiredPoints)} pts</span>
            <span className="text-slate-500 dark:text-slate-400">{reward.stock} in stock</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className={`h-full rounded-full ${reward.available ? "bg-emerald-500" : "bg-indigo-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`mt-2 text-xs font-semibold ${reward.available
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-slate-500 dark:text-slate-400"}`}>
            {reward.available ? (
              <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Ready — ask at the counter</span>
            ) : outOfStock ? (
              "Out of stock"
            ) : (
              `${formatPoints(reward.pointsMissing)} pts to go`
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

/** Customer self-service portal (RF-08): read-only view of the customer's own loyalty account. */
export function PortalPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [rewards, setRewards] = useState<PortalReward[]>([]);
  const [movements, setMovements] = useState<PortalMovement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RewardFilter>("available");
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  const logout = useCallback(() => {
    clearPortalToken();
    navigate("/portal/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!getPortalToken()) {
      navigate("/portal/login", { replace: true });
      return;
    }
    let isActive = true;
    Promise.all([getPortalProfile(), getPortalRewards(), getPortalMovements()])
      .then(([me, rewardList, movementList]) => {
        if (!isActive) return;
        setProfile(me);
        setRewards(rewardList);
        setMovements(movementList);
        // Show the full catalogue when nothing can be claimed yet.
        if (!rewardList.some((reward) => reward.available)) setFilter("all");
      })
      .catch((err: unknown) => {
        if (!isActive) return;
        // Expired token, revoked access or suspended store: back to sign-in.
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          return;
        }
        setError(extractErrorMessage(err, "Could not load your account."));
      });
    return () => {
      isActive = false;
    };
  }, [logout, navigate]);

  const availableCount = useMemo(() => rewards.filter((reward) => reward.available).length, [rewards]);
  const visibleRewards = filter === "available" ? rewards.filter((reward) => reward.available) : rewards;

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    persistTheme(next);
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-[#0d1118]">
        <div className={`${panel} max-w-md p-6`}>
          <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          <Button className="mt-4" onClick={logout}>Back to sign-in</Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500 dark:bg-[#0d1118]">
        Loading your account…
      </div>
    );
  }

  const progress = profile.tierProgress;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-[#0d1118]">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-white/[0.05] dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/25">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.tenant.name}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Customer portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
            <div className="hidden items-center gap-2.5 rounded-full border border-slate-200/80 py-1 pl-1 pr-3 dark:border-white/[0.08] sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">
                {initials(profile.firstName, profile.lastName)}
              </span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {profile.firstName} {profile.lastName}
              </span>
            </div>
            <Button size="sm" variant="ghost" leftIcon={<LogOut className="h-3.5 w-3.5" />} onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {/* ── Hero: balance + tier ─────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white sm:p-7 shadow-[0_20px_50px_-20px_rgba(79,70,229,0.55)] lg:p-9">
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div>
              <p className="text-sm text-indigo-100">Hello, {profile.firstName} 👋</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Available balance</p>
              <p className="mt-1 text-5xl font-bold tracking-tight sm:text-6xl">
                {formatPoints(profile.pointsBalance)}
                <span className="ml-2 text-2xl font-medium text-indigo-200">pts</span>
              </p>
              {profile.programs.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {profile.programs.map((program) => (
                    <span key={program.programId} className="rounded-full bg-white/15 px-3 py-1 text-xs text-white ring-1 ring-white/20">
                      {program.programName}: <strong>{formatPoints(program.pointsBalance)} pts</strong>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100">Membership tier</span>
                <span className={`rounded-lg px-2.5 py-1 text-xs font-bold tracking-wider ring-1 ${TIER_BADGE[profile.tier] ?? TIER_BADGE.BRONZE}`}>
                  {profile.tier}
                </span>
              </div>
              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-200"
                  style={{ width: `${Math.min(100, progress.progressPercentage)}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-indigo-50">
                {progress.nextTier
                  ? <><strong>{formatPoints(progress.pointsToNextTier)} pts</strong> to reach {progress.nextTier}</>
                  : "You reached the highest tier. Thank you for your loyalty!"}
              </p>
            </div>
          </div>
        </section>

        {/* ── Stats ───────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard icon={<Wallet className="h-4 w-4" />} label="Balance" value={`${formatPoints(profile.pointsBalance)} pts`} hint="Across all programs" />
          <StatCard icon={<Trophy className="h-4 w-4" />} label="Tier" value={profile.tier}
            hint={progress.nextTier ? `Next: ${progress.nextTier}` : "Highest tier"} />
          <StatCard icon={<Gift className="h-4 w-4" />} label="Ready to claim" value={availableCount}
            hint={`of ${rewards.length} active rewards`} />
          <StatCard icon={<CalendarDays className="h-4 w-4" />} label="Member since" value={formatDate(profile.memberSince)}
            hint={profile.email} />
        </section>

        {/* ── Rewards + history ───────────────────────────────── */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className={`${panel} p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Rewards</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {availableCount > 0
                    ? `You can claim ${availableCount} reward${availableCount === 1 ? "" : "s"} today at the store.`
                    : "Keep earning points to unlock a reward."}
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                {(["available", "all"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setFilter(option)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === option
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"}`}
                  >
                    {option === "available" ? `Available (${availableCount})` : `All (${rewards.length})`}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {visibleRewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </div>
            {visibleRewards.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                {rewards.length === 0 ? "This store has no active rewards yet." : "No rewards ready yet — check the full catalogue."}
              </p>
            ) : null}
          </div>

          <div className={`${panel} flex flex-col p-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Points history</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your latest movements</p>
              </div>
              <History className="h-5 w-5 text-indigo-500" />
            </div>
            <ul className="mt-4 max-h-[34rem] space-y-1 overflow-y-auto pr-1">
              {movements.map((movement) => {
                const positive = Number(movement.points) >= 0;
                return (
                  <li key={movement.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${positive
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                      {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        {MOVEMENT_LABEL[movement.type]} · {movement.programName}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(movement.date)}
                        {movement.description ? ` · ${movement.description}` : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold ${positive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"}`}>
                      {positive ? "+" : ""}
                      {formatPoints(movement.points)}
                    </span>
                  </li>
                );
              })}
              {movements.length === 0 ? <li className="py-3 text-sm text-slate-500">No movements yet.</li> : null}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
