import type { RedemptionStatus } from "../redemptions.types";

type RedemptionStatusBadgeProps = {
  status: RedemptionStatus;
};

const statusClasses: Record<RedemptionStatus, string> = {
  COMPLETED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

export function RedemptionStatusBadge({ status }: RedemptionStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[status]}`}
    >
      {status}
    </span>
  );
}
