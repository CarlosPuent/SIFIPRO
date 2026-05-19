import { Button } from "../../../components/ui/Button";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { fallbackText, formatPoints } from "../../../lib/formatters";
import type { RewardResponse } from "../rewards.types";
import { RewardStatusBadge } from "./RewardStatusBadge";

type RewardsTableProps = {
  rewards: RewardResponse[];
  actionRewardId: number | null;
  onEdit: (reward: RewardResponse) => void;
  onToggleStatus: (reward: RewardResponse) => void;
};

function getDescriptionFallback(description: string | null): string {
  return fallbackText(description, "No description provided");
}

export function RewardsTable({
  rewards,
  actionRewardId,
  onEdit,
  onToggleStatus,
}: RewardsTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Rewards
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total: {rewards.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50/70 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Description</th>
              <th className="px-5 py-3 font-semibold">Required Points</th>
              <th className="px-5 py-3 font-semibold">Stock</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            {rewards.map((reward) => {
              const isActionLoading = actionRewardId === reward.id;

              return (
                <tr key={reward.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {reward.name}
                  </td>
                  <td className="max-w-sm px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    <span className="line-clamp-2">
                      {getDescriptionFallback(reward.description)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {formatPoints(reward.requiredPoints)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {reward.stock}
                  </td>
                  <td className="px-5 py-3.5">
                    <RewardStatusBadge active={reward.active} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(reward)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() => onToggleStatus(reward)}
                      >
                        {reward.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
