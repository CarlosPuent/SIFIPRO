import { Download, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";
import { extractErrorMessage } from "../../lib/error-utils";
import { formatDateTime, formatNumber } from "../../lib/formatters";
import { buildTenantActivityCsv, getPlatformMetrics, type PlatformMetrics } from "./metrics.service";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(month: string): string {
  const [year, value] = month.split("-");
  return `${MONTHS[Number(value) - 1] ?? value} ${year.slice(2)}`;
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <SurfaceCard className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </SurfaceCard>
  );
}

/**
 * Platform report for the SIFIPRO team: adoption and activity of every merchant.
 * Only aggregated counts per tenant are shown, never a merchant's individual data.
 */
export function PlatformOverviewPage() {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setMetrics(await getPlatformMetrics());
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    getPlatformMetrics()
      .then((data) => {
        if (isActive) setMetrics(data);
      })
      .catch((err: unknown) => {
        if (isActive) setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const exportCsv = () => {
    if (!metrics) return;
    const blob = new Blob([buildTenantActivityCsv(metrics.tenants)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sifipro-platform-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <SurfaceCard className="p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Could not load the platform report</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error}</p>
        <Button className="mt-5" onClick={() => void load()}>Retry</Button>
      </SurfaceCard>
    );
  }

  if (isLoading || !metrics) {
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800/60" />;
  }

  const { totals, monthly, tenants } = metrics;
  const maxSales = Math.max(1, ...monthly.map((m) => Number(m.salesAmount)));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Platform overview
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Adoption and activity of every merchant on SIFIPRO. Generated {formatDateTime(metrics.generatedAt)}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => void load()}>
            Refresh
          </Button>
          <Button size="sm" variant="primary" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Merchants" value={formatNumber(totals.tenants, 0)}
          hint={`${totals.activeTenants} active · ${totals.suspendedTenants} suspended`} />
        <Kpi label="End customers" value={formatNumber(totals.customers, 0)} hint="Across all merchants" />
        <Kpi label="Sales recorded" value={`$${formatNumber(totals.salesAmount, 2)}`}
          hint={`${formatNumber(totals.purchases, 0)} purchases`} />
        <Kpi label="Points issued" value={formatNumber(totals.pointsIssued, 0)}
          hint={`${formatNumber(totals.redemptions, 0)} redemptions`} />
      </div>

      <SurfaceCard>
        <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">Sales on the platform</h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Last 6 months, all merchants.</p>
        <div className="mt-6 flex h-52 items-end gap-3">
          {monthly.map((m) => {
            const height = Math.max(2, (Number(m.salesAmount) / maxSales) * 100);
            return (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  ${formatNumber(m.salesAmount, 0)}
                </span>
                <div
                  className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-500"
                  style={{ height: `${height}%` }}
                  title={`${m.purchases} purchases · ${m.newCustomers} new customers`}
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{monthLabel(m.month)}</span>
              </div>
            );
          })}
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden p-0">
        <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
          <h2 className="text-sm font-semibold tracking-wide text-slate-800 dark:text-slate-100">Activity by merchant</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Ordered by sales. Aggregates only.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/70 text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Merchant</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Users</th>
                <th className="px-5 py-3 text-right font-semibold">Customers</th>
                <th className="px-5 py-3 text-right font-semibold">Purchases</th>
                <th className="px-5 py-3 text-right font-semibold">Sales</th>
                <th className="px-5 py-3 text-right font-semibold">Points</th>
                <th className="px-5 py-3 text-right font-semibold">Redemptions</th>
                <th className="px-5 py-3 font-semibold">Last purchase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{t.name}</p>
                    <p className="font-mono text-xs text-slate-500">{t.code}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300"}`}>
                      {t.active ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">{t.users}</td>
                  <td className="px-5 py-3 text-right">{formatNumber(t.customers, 0)}</td>
                  <td className="px-5 py-3 text-right">{formatNumber(t.purchases, 0)}</td>
                  <td className="px-5 py-3 text-right">${formatNumber(t.salesAmount, 2)}</td>
                  <td className="px-5 py-3 text-right">{formatNumber(t.pointsIssued, 0)}</td>
                  <td className="px-5 py-3 text-right">{formatNumber(t.redemptions, 0)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {t.lastPurchaseAt ? formatDateTime(t.lastPurchaseAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </section>
  );
}
