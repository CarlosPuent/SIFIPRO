import { formatInteger, formatPoints } from "../../../lib/formatters";
import type { StockAlertEntry } from "../reports.types";
import { ReportTableCard } from "./ReportTableCard";

type StockAlertsReportTableProps = {
  alerts: StockAlertEntry[];
};

export function StockAlertsReportTable({ alerts }: StockAlertsReportTableProps) {
  return (
    <ReportTableCard
      title="Stock Alerts"
      description="Active rewards of the program with 5 units or fewer (current stock)."
      isEmpty={alerts.length === 0}
      emptyMessage="All active rewards have enough stock."
      headers={["Reward", "Stock", "Required Points", "Status"]}
    >
      {alerts.map((alert) => (
        <tr key={alert.id}>
          <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
            {alert.name}
          </td>
          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
            {formatInteger(alert.stock)}
          </td>
          <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
            {formatPoints(alert.requiredPoints)}
          </td>
          <td className="px-5 py-3.5">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                alert.status === "OUT_OF_STOCK"
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {alert.status === "OUT_OF_STOCK" ? "Out of stock" : "Low stock"}
            </span>
          </td>
        </tr>
      ))}
    </ReportTableCard>
  );
}
