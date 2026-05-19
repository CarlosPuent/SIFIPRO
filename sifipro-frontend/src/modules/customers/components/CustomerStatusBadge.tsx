type CustomerStatusBadgeProps = {
  active: boolean;
};

export function CustomerStatusBadge({ active }: CustomerStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
