import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import {
  fallbackText,
  formatDateTime,
  formatPoints,
} from "../../../lib/formatters";
import type { RedemptionResponse } from "../redemptions.types";
import { RedemptionStatusBadge } from "./RedemptionStatusBadge";

type CustomerRedemptionsTableProps = {
  selectedCustomerName: string | null;
  redemptions: RedemptionResponse[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

function getNotesFallback(notes: string | null): string {
  return fallbackText(notes);
}

export function CustomerRedemptionsTable({
  selectedCustomerName,
  redemptions,
  isLoading,
  errorMessage,
  onRetry,
}: CustomerRedemptionsTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Customer Redemption History
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {selectedCustomerName
            ? `Customer: ${selectedCustomerName}`
            : "Select a redemption to view history."}
        </p>
      </div>

      {!selectedCustomerName ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No customer selected yet.
        </p>
      ) : isLoading ? (
        <div className="space-y-2 p-5">
          <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
      ) : errorMessage ? (
        <div className="p-5">
          <p className="text-sm text-rose-600 dark:text-rose-300">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex rounded-lg border border-slate-300 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400 hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-100 dark:text-slate-900 dark:hover:border-slate-500 dark:hover:bg-white"
          >
            Retry
          </button>
        </div>
      ) : redemptions.length === 0 ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No redemption records available for this customer in the selected
          program.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Program</th>
                <th className="px-5 py-3 font-medium">Reward</th>
                <th className="px-5 py-3 font-medium">Points Used</th>
                <th className="px-5 py-3 font-medium">Redemption Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
              {redemptions.map((redemption) => (
                <tr key={redemption.id}>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {fallbackText(
                      redemption.programName,
                      `Program #${redemption.programConfigId}`,
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
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
                  <td className="max-w-xs px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    <span className="line-clamp-2">
                      {getNotesFallback(redemption.notes)}
                    </span>
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
