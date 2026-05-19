import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import {
  fallbackText,
  formatDateTime,
  formatPoints,
} from "../../../lib/formatters";
import type { RedemptionResponse } from "../redemptions.types";
import { RedemptionStatusBadge } from "./RedemptionStatusBadge";

type RedemptionsTableProps = {
  redemptions: RedemptionResponse[];
  selectedRedemptionId: number | null;
  onSelectRedemption: (redemption: RedemptionResponse) => void;
};

export function RedemptionsTable({
  redemptions,
  selectedRedemptionId,
  onSelectRedemption,
}: RedemptionsTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Redemptions
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total: {redemptions.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Program</th>
              <th className="px-5 py-3 font-medium">Reward</th>
              <th className="px-5 py-3 font-medium">Points Used</th>
              <th className="px-5 py-3 font-medium">Redemption Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            {redemptions.map((redemption) => {
              const isSelected = selectedRedemptionId === redemption.id;

              return (
                <tr
                  key={redemption.id}
                  tabIndex={0}
                  onClick={() => onSelectRedemption(redemption)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectRedemption(redemption);
                    }
                  }}
                  className={`cursor-pointer outline-none transition ${
                    isSelected
                      ? "bg-slate-100/80 dark:bg-slate-800/50"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {redemption.customerFullName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {fallbackText(
                      redemption.programName,
                      `Program #${redemption.programConfigId}`,
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {redemption.rewardName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {formatPoints(redemption.pointsUsed)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {formatDateTime(redemption.redemptionDate)}
                  </td>
                  <td className="px-5 py-3.5">
                    <RedemptionStatusBadge status={redemption.status} />
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
