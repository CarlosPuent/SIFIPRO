import { Link } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { fallbackText, formatPoints } from "../../../lib/formatters";
import type { CustomerResponse } from "../customers.types";
import { CustomerStatusBadge } from "./CustomerStatusBadge";

type CustomersTableProps = {
  customers: CustomerResponse[];
  actionCustomerId: number | null;
  onEdit: (id: number) => void;
  onToggleStatus: (customer: CustomerResponse) => void;
};

function getFullName(customer: CustomerResponse): string {
  return `${customer.firstName} ${customer.lastName}`;
}

export function CustomersTable({
  customers,
  actionCustomerId,
  onEdit,
  onToggleStatus,
}: CustomersTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Customers
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Tenant customer records and current balance visibility.
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total: {customers.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50/70 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Email</th>
              <th className="px-5 py-3 font-semibold">Phone</th>
              <th className="px-5 py-3 font-semibold">Points Balance</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            {customers.map((customer) => {
              const isActionLoading = actionCustomerId === customer.id;

              return (
                <tr key={customer.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/customers/${customer.id}`}
                      className="font-medium text-slate-800 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                    >
                      {getFullName(customer)}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {customer.email}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {fallbackText(customer.phone)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                    {formatPoints(customer.pointsBalance)}
                  </td>
                  <td className="px-5 py-3.5">
                    <CustomerStatusBadge active={customer.active} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-transparent bg-transparent px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
                      >
                        Profile
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(customer.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        isLoading={isActionLoading}
                        onClick={() => onToggleStatus(customer)}
                      >
                        {customer.active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
