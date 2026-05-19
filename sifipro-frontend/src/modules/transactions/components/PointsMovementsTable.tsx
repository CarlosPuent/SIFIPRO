import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import {
  fallbackText,
  formatDateTime,
  formatNumber,
} from "../../../lib/formatters";
import type { PointsMovementResponse } from "../transactions.types";
import { MovementTypeBadge } from "./MovementTypeBadge";

type PointsMovementsTableProps = {
  programName: string;
  movements: PointsMovementResponse[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
};

function getDescriptionFallback(description: string | null): string {
  return fallbackText(description);
}

export function PointsMovementsTable({
  programName,
  movements,
  isLoading,
  errorMessage,
  onRetry,
}: PointsMovementsTableProps) {
  const hasMovements = movements.length > 0;

  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Points Movements
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Program: {programName}
        </p>
      </div>

      {isLoading ? (
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
      ) : !hasMovements ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No points movement records available for this program.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Points</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Reference Type</th>
                <th className="px-5 py-3 font-medium">Reference Id</th>
                <th className="px-5 py-3 font-medium">Movement Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {fallbackText(
                      movement.customerFullName,
                      `Customer #${movement.customerId}`,
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <MovementTypeBadge type={movement.type} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {formatNumber(movement.points)}
                  </td>
                  <td className="max-w-xs px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    <span className="line-clamp-2">
                      {getDescriptionFallback(movement.description)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {movement.referenceType}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {movement.referenceId}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {formatDateTime(movement.movementDate)}
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
