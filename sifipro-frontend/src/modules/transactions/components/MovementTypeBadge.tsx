import type { PointsMovementType } from "../transactions.types";

type MovementTypeBadgeProps = {
  type: PointsMovementType;
};

const movementTypeClasses: Record<PointsMovementType, string> = {
  EARN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  REDEEM: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
  ADJUSTMENT:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  EXPIRE: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
};

export function MovementTypeBadge({ type }: MovementTypeBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${movementTypeClasses[type]}`}
    >
      {type}
    </span>
  );
}
