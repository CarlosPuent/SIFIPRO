import { Button } from "../../../components/ui/Button";
import { SurfaceCard } from "../../../components/ui/SurfaceCard";
import { formatDateTime } from "../../../lib/formatters";
import type { TenantResponse } from "../tenant.types";
import { TenantStatusBadge } from "./TenantStatusBadge";

type TenantsTableProps = {
  tenants: TenantResponse[];
  actionTenantId: number | null;
  onToggleStatus: (tenant: TenantResponse) => void;
};

export function TenantsTable({
  tenants,
  actionTenantId,
  onToggleStatus,
}: TenantsTableProps) {
  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">
            Tenants
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Every tenant provisioned on the SIFIPRO platform.
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Total: {tenants.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50/70 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 font-semibold">Name</th>
              <th className="px-5 py-3 font-semibold">Code</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Created</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
            {tenants.map((tenant) => {
              const isActionLoading = actionTenantId === tenant.id;

              return (
                <tr
                  key={tenant.id}
                  className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-100">
                    {tenant.name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {tenant.code}
                  </td>
                  <td className="px-5 py-3.5">
                    <TenantStatusBadge active={tenant.active} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                    {formatDateTime(tenant.createdAt)}
                  </td>
                  <td className="px-5 py-3.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={isActionLoading}
                      onClick={() => onToggleStatus(tenant)}
                    >
                      {tenant.active ? "Deactivate" : "Activate"}
                    </Button>
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
