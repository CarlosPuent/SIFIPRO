import { formatDateTime, formatNumber, fallbackText } from "../../../lib/formatters";
import type {
  CustomerProfileRedemptionEntry,
  CustomerProfileTransactionEntry,
} from "../customer-profile.types";

function toNum(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolvePoints(
  entry: CustomerProfileTransactionEntry,
): number {
  return toNum(entry.pointsEarned ?? entry.awardedPoints ?? 0);
}

type TransactionFeedProps = {
  transactions: CustomerProfileTransactionEntry[];
};

function TransactionFeed({ transactions }: TransactionFeedProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900/75">
      <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Recent Transactions
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Latest purchase activity
        </p>
      </div>

      {transactions.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">
          No transactions recorded.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100/80 dark:divide-slate-800/60">
          {transactions.map((tx, idx) => {
            const points = resolvePoints(tx);
            return (
              <li key={tx.id ?? idx} className="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                {/* Timeline dot */}
                <div className="mt-1.5 flex-shrink-0">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 dark:border-indigo-800/60 dark:bg-indigo-950/50">
                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                        Purchase — ${formatNumber(toNum(tx.amount), 2)}
                      </p>
                      {tx.programName ? (
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {tx.programName}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        +{formatNumber(points, 0)} pts
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                        {fallbackText(formatDateTime(tx.transactionDate))}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type RedemptionFeedProps = {
  redemptions: CustomerProfileRedemptionEntry[];
};

function RedemptionFeed({ redemptions }: RedemptionFeedProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm transition-colors dark:border-slate-800/80 dark:bg-slate-900/75">
      <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Recent Redemptions
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Latest reward redemptions
        </p>
      </div>

      {redemptions.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400">
          No redemptions recorded.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100/80 dark:divide-slate-800/60">
          {redemptions.map((rd, idx) => (
            <li key={rd.id ?? idx} className="flex items-start gap-3.5 px-5 py-3.5 transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
              {/* Timeline dot */}
              <div className="mt-1.5 flex-shrink-0">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/50">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                </div>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {rd.rewardName}
                    </p>
                    {rd.programName ? (
                      <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {rd.programName}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      -{formatNumber(toNum(rd.pointsUsed), 0)} pts
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                      {fallbackText(formatDateTime(rd.redemptionDate))}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type CustomerActivityFeedProps = {
  transactions: CustomerProfileTransactionEntry[];
  redemptions: CustomerProfileRedemptionEntry[];
};

export function CustomerActivityFeed({
  transactions,
  redemptions,
}: CustomerActivityFeedProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <TransactionFeed transactions={transactions} />
      <RedemptionFeed redemptions={redemptions} />
    </div>
  );
}
