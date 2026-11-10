import axios from "axios";
import { Gift, LogOut, Sparkles, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { extractErrorMessage } from "../../lib/error-utils";
import { formatDateTime, formatPoints } from "../../lib/formatters";
import {
  clearPortalToken,
  getPortalMovements,
  getPortalProfile,
  getPortalRewards,
  getPortalToken,
} from "./portal.service";
import type { PortalMovement, PortalProfile, PortalReward } from "./portal.types";

const TIER_STYLES: Record<string, string> = {
  GOLD: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40",
  SILVER: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/40",
  BRONZE: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/40",
};

const MOVEMENT_LABEL: Record<PortalMovement["type"], string> = {
  EARN: "Earned",
  REDEEM: "Redeemed",
  ADJUSTMENT: "Adjustment",
  EXPIRE: "Expired",
};

const card = "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950 sm:p-6";

/** Customer self-service portal (RF-08): read-only view of the customer's own loyalty account. */
export function PortalPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [rewards, setRewards] = useState<PortalReward[]>([]);
  const [movements, setMovements] = useState<PortalMovement[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-[#0d1118]">
        <div className={card}>
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
  const availableCount = rewards.filter((reward) => reward.available).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1118]">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{profile.tenant.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Loyalty program · SIFIPRO</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" leftIcon={<LogOut className="h-3.5 w-3.5" />} onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-5 py-8">
        {/* Balance + tier */}
        <section className={`${card} relative overflow-hidden`}>
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Hello,</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {profile.firstName} {profile.lastName}
          </h1>
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <p className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              {formatPoints(profile.pointsBalance)}
              <span className="ml-2 text-lg font-medium text-slate-500">pts</span>
            </p>
            <span className={`mb-2 rounded-lg border px-2.5 py-1 text-xs font-bold tracking-wider ${TIER_STYLES[profile.tier] ?? TIER_STYLES.BRONZE}`}>
              {profile.tier}
            </span>
          </div>
          <div className="mt-5">
            <div className="mb-2 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{profile.tier} tier</span>
              <span>
                {progress.nextTier
                  ? `${formatPoints(progress.pointsToNextTier)} pts to ${progress.nextTier}`
                  : "Highest tier reached"}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                style={{ width: `${Math.min(100, progress.progressPercentage)}%` }}
              />
            </div>
          </div>
          {profile.programs.length > 1 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {profile.programs.map((program) => (
                <span key={program.programId} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {program.programName}: <strong>{formatPoints(program.pointsBalance)} pts</strong>
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {/* Rewards */}
        <section className={card}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Rewards</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {availableCount > 0
                  ? `You can claim ${availableCount} reward${availableCount === 1 ? "" : "s"} today at the store.`
                  : "Keep earning points to unlock a reward."}
              </p>
            </div>
            <Gift className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <article
                key={reward.id}
                className={`rounded-xl border p-4 ${reward.available
                  ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-700/60 dark:bg-emerald-950/20"
                  : "border-slate-200 dark:border-slate-800"}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{reward.programName}</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{reward.name}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatPoints(reward.requiredPoints)} pts</p>
                <p className={`mt-2 text-xs font-semibold ${reward.available ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500"}`}>
                  {reward.available ? (
                    <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Available — ask at the counter</span>
                  ) : reward.stock <= 0 ? (
                    "Out of stock"
                  ) : (
                    `${formatPoints(reward.pointsMissing)} pts to go`
                  )}
                </p>
              </article>
            ))}
            {rewards.length === 0 ? (
              <p className="text-sm text-slate-500">This store has no active rewards yet.</p>
            ) : null}
          </div>
        </section>

        {/* History */}
        <section className={card}>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Points history</h2>
          <ul className="mt-3 divide-y divide-slate-200/80 dark:divide-slate-800/80">
            {movements.map((movement) => (
              <li key={movement.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {MOVEMENT_LABEL[movement.type]} · {movement.programName}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {formatDateTime(movement.date)}
                    {movement.description ? ` · ${movement.description}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-semibold ${movement.points >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {movement.points >= 0 ? "+" : ""}
                  {formatPoints(movement.points)}
                </span>
              </li>
            ))}
            {movements.length === 0 ? <li className="py-3 text-sm text-slate-500">No movements yet.</li> : null}
          </ul>
        </section>
      </main>
    </div>
  );
}
