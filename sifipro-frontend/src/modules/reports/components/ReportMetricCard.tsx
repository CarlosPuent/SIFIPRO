import { SurfaceCard } from "../../../components/ui/SurfaceCard";

type ReportMetricCardProps = {
  label: string;
  value: string;
};

export function ReportMetricCard({ label, value }: ReportMetricCardProps) {
  return (
    <SurfaceCard className="relative overflow-hidden p-4 sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-slate-300 via-slate-200 to-transparent dark:from-slate-700 dark:via-slate-800" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </SurfaceCard>
  );
}
