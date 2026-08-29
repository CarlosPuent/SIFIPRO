export function mergeClassNames(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}

const baseControlClassName =
  "block w-full rounded-[0.85rem] border bg-white/95 px-3.5 py-2.5 text-[0.925rem] text-slate-900 shadow-[0_2px_8px_rgba(15,23,42,0.04)] outline-none transition-all duration-200 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50/50 disabled:opacity-50 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600";

const normalControlStateClassName =
  "border-slate-200/90 focus:border-indigo-500/80 focus:ring-[3px] focus:ring-indigo-500/15 focus:bg-white dark:border-slate-700/80 dark:focus:border-indigo-400/80 dark:focus:ring-indigo-400/15 dark:focus:bg-slate-900/95";

const errorControlStateClassName =
  "border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500/80 focus:ring-[3px] focus:ring-rose-500/15 dark:border-rose-500/50 dark:bg-rose-950/10 dark:text-rose-100 dark:focus:border-rose-400/80 dark:focus:ring-rose-400/15";

export function getFormControlClassName({
  error,
  className,
}: {
  error?: boolean;
  className?: string;
}): string {
  return mergeClassNames(
    baseControlClassName,
    error ? errorControlStateClassName : normalControlStateClassName,
    className,
  );
}
