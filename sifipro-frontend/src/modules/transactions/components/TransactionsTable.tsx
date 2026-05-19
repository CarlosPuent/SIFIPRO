import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import {
  fallbackText,
  formatDateTime,
  formatNumber,
} from "../../../lib/formatters";
import type { PurchaseTransactionResponse } from "../transactions.types";

type TransactionsTableProps = {
  transactions: PurchaseTransactionResponse[];
  selectedTransactionId?: number | null;
  onSelectTransaction?: (transaction: PurchaseTransactionResponse) => void;
};

function getDescriptionFallback(description: string | null): string {
  return fallbackText(description);
}

function resolveAwardedPoints(
  transaction: PurchaseTransactionResponse,
): number | string {
  if (
    transaction.awardedPoints !== undefined &&
    transaction.awardedPoints !== null
  ) {
    return transaction.awardedPoints;
  }

  if (
    transaction.pointsEarned !== undefined &&
    transaction.pointsEarned !== null
  ) {
    return transaction.pointsEarned;
  }

  return 0;
}

export function TransactionsTable({
  transactions,
  selectedTransactionId,
  onSelectTransaction,
}: TransactionsTableProps) {
  const isSelectable = Boolean(onSelectTransaction);

  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Transactions
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total: {transactions.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Program</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">Transaction Date</th>
              <th className="px-5 py-3 font-medium">Awarded Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            {transactions.map((transaction) => {
              const isSelected = selectedTransactionId === transaction.id;

              return (
                <tr
                  key={transaction.id}
                  tabIndex={isSelectable ? 0 : -1}
                  onClick={() => {
                    onSelectTransaction?.(transaction);
                  }}
                  onKeyDown={(event) => {
                    if (!isSelectable) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectTransaction?.(transaction);
                    }
                  }}
                  className={`outline-none transition ${
                    isSelectable && isSelected
                      ? "bg-slate-100/80 dark:bg-slate-800/50"
                      : isSelectable
                        ? "cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900/60"
                        : "cursor-default"
                  }`}
                >
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {transaction.customerFullName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {fallbackText(
                      transaction.programName,
                      `Program #${transaction.programConfigId}`,
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {formatNumber(transaction.amount)}
                  </td>
                  <td className="max-w-xs px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    <span className="line-clamp-2">
                      {getDescriptionFallback(transaction.description)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {formatDateTime(transaction.transactionDate)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {formatNumber(resolveAwardedPoints(transaction))}
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
