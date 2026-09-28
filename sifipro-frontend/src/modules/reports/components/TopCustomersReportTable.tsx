import { Link } from "react-router-dom";
import { formatInteger, formatNumber, formatPoints } from "../../../lib/formatters";
import type { TopCustomerReportEntry } from "../reports.types";
import { ReportTableCard } from "./ReportTableCard";

type TopCustomersReportTableProps = {
  customers: TopCustomerReportEntry[];
};

export function TopCustomersReportTable({ customers }: TopCustomersReportTableProps) {
  return (
    <ReportTableCard
      title="Top Customers"
      description="Ranked by points earned in the selected program and period."
      isEmpty={customers.length === 0}
      emptyMessage="No purchases in the selected period."
      headers={["Customer", "Purchases", "Amount", "Points Earned", "Redemptions"]}
      numericColumns={[1, 2, 3, 4]}
    >
      {customers.map((customer) => (
        <tr key={customer.customerId}>
          <td className="max-w-0 px-4 py-3.5 sm:max-w-none">
            <Link
              to={`/customers/${customer.customerId}`}
              className="font-medium text-slate-800 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
            >
              {customer.customerFullName}
            </Link>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={customer.email}>
              {customer.email}
            </p>
          </td>
          <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200">
            {formatInteger(customer.purchases)}
          </td>
          <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200">
            ${formatNumber(customer.amount, 2)}
          </td>
          <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums font-medium text-slate-800 dark:text-slate-100">
            {formatPoints(customer.pointsEarned)}
          </td>
          <td className="px-4 py-3.5 text-right whitespace-nowrap tabular-nums text-slate-700 dark:text-slate-200">
            {formatInteger(customer.redemptions)}
          </td>
        </tr>
      ))}
    </ReportTableCard>
  );
}
