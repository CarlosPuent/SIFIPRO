import { formatInteger, formatPoints } from "../../../lib/formatters";
import type { TopRewardReportEntry } from "../reports.types";
import { ReportTableCard } from "./ReportTableCard";

type TopRedeemedRewardsReportTableProps = {
  rewards: TopRewardReportEntry[];
};

export function TopRedeemedRewardsReportTable({ rewards }: TopRedeemedRewardsReportTableProps) {
  return (
    <ReportTableCard
      title="Top Redeemed Rewards"
      description="Ranked by redemptions in the selected program and period."
      isEmpty={rewards.length === 0}
      emptyMessage="No redemptions in the selected period."
      headers={["Reward", "Redemptions", "Points Redeemed", "Stock"]}
      numericColumns={[1, 2, 3]}
    >
      {rewards.map((reward) => (
        <tr key={reward.rewardId}>
          <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-100">
            {reward.rewardName}
          </td>
          <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200">
            {formatInteger(reward.redemptions)}
          </td>
          <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200">
            {formatPoints(reward.pointsRedeemed)}
          </td>
          <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200">
            {formatInteger(reward.stock)}
          </td>
        </tr>
      ))}
    </ReportTableCard>
  );
}
