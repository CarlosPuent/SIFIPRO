import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { DateField, SelectField } from "../../components/ui/form";
import { extractErrorMessage } from "../../lib/error-utils";
import { fallbackText, formatDateTime, formatInteger, formatNumber } from "../../lib/formatters";
import { getCustomers } from "../customers/customers.service";
import type { CustomerResponse } from "../customers/customers.types";
import { getUsers } from "../users/users.service";
import type { UserResponse } from "../users/users.types";
import { getAuditMovements } from "./audit.service";
import type { AuditFilters, AuditMovementType, AuditPage } from "./audit.types";

const PAGE_SIZE = 20;

const EMPTY_FILTERS: AuditFilters = { from: "", to: "", type: "", customerId: "", userId: "" };

const TYPE_LABELS: Record<AuditMovementType, string> = {
  EARN: "Earned",
  REDEEM: "Redeemed",
  ADJUSTMENT: "Adjustment",
  EXPIRE: "Expired",
};

const TYPE_STYLES: Record<AuditMovementType, string> = {
  EARN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  REDEEM: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  ADJUSTMENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  EXPIRE: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function TypeBadge({ type }: { type: AuditMovementType }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_STYLES[type] ?? TYPE_STYLES.EXPIRE}`}>
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

function formatSignedPoints(points: number): string {
  const value = Number(points);
  const formatted = formatNumber(Math.abs(value), 2);
  return value < 0 ? `−${formatted}` : `+${formatted}`;
}

export function AuditLogPage() {
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [retryToken, setRetryToken] = useState(0);
  const [data, setData] = useState<AuditPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);

  const dateRangeError =
    filters.from && filters.to && filters.from > filters.to
      ? "The start date must be on or before the end date."
      : null;

  // Options for the customer and user filters (loaded once).
  useEffect(() => {
    let isActive = true;
    Promise.all([getCustomers(), getUsers()])
      .then(([customerList, userList]) => {
        if (!isActive) return;
        setCustomers(customerList);
        setUsers(userList);
      })
      .catch(() => {
        // The log still works without the filter options.
      });
    return () => {
      isActive = false;
    };
  }, []);

  // New filters or page start a new load; the reset happens during render (React's
  // "adjusting state when a prop changes" pattern) and the effect applies the result.
  const requestKey = dateRangeError ? null : JSON.stringify({ filters, page, retryToken });
  const [loadedKey, setLoadedKey] = useState<string | null | undefined>(undefined);
  if (loadedKey !== requestKey) {
    setLoadedKey(requestKey);
    setLoadError(null);
    setIsLoading(requestKey !== null);
  }

  useEffect(() => {
    if (dateRangeError) {
      return;
    }

    let isActive = true;

    getAuditMovements(filters, page, PAGE_SIZE)
      .then((result) => {
        if (isActive) setData(result);
      })
      .catch((error: unknown) => {
        if (isActive) setLoadError(extractErrorMessage(error, "Could not load the audit log."));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [filters, page, retryToken, dateRangeError]);

  const updateFilter = (field: keyof AuditFilters, value: string) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(0);
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const firstRow = data && data.totalElements > 0 ? data.page * data.size + 1 : 0;
  const lastRow = data ? Math.min((data.page + 1) * data.size, data.totalElements) : 0;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Audit Log
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Every points grant, redemption and manual adjustment of this tenant, with who
          registered it and why. Newest first.
        </p>
      </header>

      <SurfaceCard className="space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            From
            <DateField className="mt-1" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            To
            <DateField className="mt-1" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} />
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Type
            <SelectField className="mt-1" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
              <option value="">All types</option>
              <option value="EARN">Earned</option>
              <option value="REDEEM">Redeemed</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </SelectField>
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Customer
            <SelectField className="mt-1" value={filters.customerId} onChange={(event) => updateFilter("customerId", event.target.value)}>
              <option value="">All customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                </option>
              ))}
            </SelectField>
          </label>
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Registered by
            <SelectField className="mt-1" value={filters.userId} onChange={(event) => updateFilter("userId", event.target.value)}>
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.role})
                </option>
              ))}
            </SelectField>
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {dateRangeError ? (
            <p className="text-xs text-rose-600 dark:text-rose-400">{dateRangeError}</p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {data ? `${formatInteger(data.totalElements)} movement(s)` : " "}
            </p>
          )}
          {hasFilters ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setPage(0);
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </SurfaceCard>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70" />
      ) : loadError ? (
        <SurfaceCard className="p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Failed to load the audit log</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{loadError}</p>
          <Button className="mt-5" onClick={() => setRetryToken((token) => token + 1)}>
            Retry
          </Button>
        </SurfaceCard>
      ) : !data || data.content.length === 0 ? (
        <SurfaceCard className="p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No movements found</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {hasFilters ? "No movement matches the selected filters." : "This tenant has no points movements yet."}
          </p>
        </SurfaceCard>
      ) : (
        <SurfaceCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 text-right font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Registered by</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-sm dark:divide-slate-800/80">
                {data.content.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDateTime(entry.date)}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={entry.type} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/customers/${entry.customerId}`}
                        className="font-medium text-slate-800 transition-colors hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400"
                      >
                        {entry.customerName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.programName}</td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${
                        Number(entry.points) < 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {formatSignedPoints(entry.points)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{entry.referenceLabel}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {fallbackText(entry.registeredByName)}
                      {entry.registeredByEmail ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{entry.registeredByEmail}</p>
                      ) : null}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-600 dark:text-slate-300">{fallbackText(entry.reason)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
            <span>
              Showing {formatInteger(firstRow)}–{formatInteger(lastRow)} of {formatInteger(data.totalElements)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                disabled={data.page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <span>
                Page {data.page + 1} of {Math.max(1, data.totalPages)}
              </span>
              <Button
                size="sm"
                disabled={data.page + 1 >= data.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </SurfaceCard>
      )}
    </section>
  );
}
