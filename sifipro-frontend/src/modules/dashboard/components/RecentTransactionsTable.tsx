import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { formatDateTime, formatNumber } from "../../../lib/formatters";
import type { DashboardTransactionResponse } from "../dashboard.types";

type RecentTransactionsTableProps = {
  transactions: DashboardTransactionResponse[];
};

export function RecentTransactionsTable({
  transactions,
}: RecentTransactionsTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/40 px-4 py-3.5 dark:border-slate-800/80 dark:bg-slate-950/30 sm:px-5">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Recent Transactions
        </h2>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          Latest 5
        </span>
      </div>

      {transactions.length === 0 ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No recent transactions available.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-100/70 text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-semibold sm:px-5">Customer</th>
                <th className="px-4 py-3 font-semibold sm:px-5">Amount</th>
                <th className="px-4 py-3 font-semibold sm:px-5">Transaction Date</th>
                <th className="px-4 py-3 font-semibold sm:px-5">Points Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="transition hover:bg-slate-50/70 dark:hover:bg-slate-900/45"
                >
                  <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-100 sm:px-5">
                    {transaction.customerFullName}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-200 sm:px-5">
                    {formatNumber(transaction.amount)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 sm:px-5">
                    {formatDateTime(transaction.transactionDate)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-200 sm:px-5">
                    {formatNumber(transaction.pointsEarned)}
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
