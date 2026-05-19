import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { formatInteger } from "../../../lib/formatters";
import type { TopRedeemedRewardResponse } from "../reports.types";

type TopRedeemedRewardsReportTableProps = {
  rewards: TopRedeemedRewardResponse[];
};

export function TopRedeemedRewardsReportTable({
  rewards,
}: TopRedeemedRewardsReportTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Top Redeemed Rewards
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Rewards with the highest redemption volume in the selected program.
          </p>
        </div>
      </div>

      {rewards.length === 0 ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No reward redemption records available yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Reward</th>
                <th className="px-5 py-3 font-medium">Total Redemptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
              {rewards.map((reward) => (
                <tr key={reward.rewardId}>
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {reward.rewardName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {formatInteger(reward.totalRedemptions)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SurfaceCard>
  );
}
