import type { RewardResponse } from "../rewards.types";
import { RewardCard } from "./RewardCard";

type RewardsGridProps = {
  rewards: RewardResponse[];
  actionRewardId: number | null;
  onEdit: (reward: RewardResponse) => void;
  onToggleStatus: (reward: RewardResponse) => void;
};

export function RewardsGrid({
  rewards,
  actionRewardId,
  onEdit,
  onToggleStatus,
}: RewardsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rewards.map((reward) => (
        <RewardCard
          key={reward.id}
          reward={reward}
          isLoading={actionRewardId === reward.id}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}
