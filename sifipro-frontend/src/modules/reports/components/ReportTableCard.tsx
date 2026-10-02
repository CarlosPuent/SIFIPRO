import type { ReactNode } from "react";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";

type ReportTableCardProps = {
  title: string;
  description: string;
  isEmpty: boolean;
  emptyMessage: string;
  headers: string[];
  // Indexes of numeric columns: right-aligned so figures line up.
  numericColumns?: number[];
  children: ReactNode;
};

// Shared frame for the report tables: title, empty state and a scrollable table.
export function ReportTableCard({
  title,
  description,
  isEmpty,
  emptyMessage,
  headers,
  numericColumns = [],
  children,
}: ReportTableCardProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      {isEmpty ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={header}
                    className={`px-4 py-3 font-medium ${numericColumns.includes(index) ? "text-right" : ""}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
              {children}
            </tbody>
          </table>
        </div>
      )}
    </SurfaceCard>
  );
}
