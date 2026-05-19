import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { formatPoints } from "../../../lib/formatters";
import type { TopCustomerResponse } from "../dashboard.types";

type TopCustomersTableProps = {
  customers: TopCustomerResponse[];
};

export function TopCustomersTable({ customers }: TopCustomersTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
          Top Customers
        </h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          By points balance
        </span>
      </div>

      {customers.length === 0 ? (
        <p className="px-5 py-10 text-sm text-slate-500 dark:text-slate-400">
          No customer data available yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Points</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
              {customers.map((customer) => (
                <tr key={customer.customerId} className="bg-transparent">
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {customer.customerFullName}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {customer.email}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {formatPoints(customer.pointsBalance)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        customer.active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {customer.active ? "Active" : "Inactive"}
                    </span>
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
