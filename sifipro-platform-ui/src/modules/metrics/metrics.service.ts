import { apiClient } from "../../lib/api-client";

export type TenantActivity = {
  id: number;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
  users: number;
  programs: number;
  customers: number;
  purchases: number;
  salesAmount: number;
  pointsIssued: number;
  redemptions: number;
  lastPurchaseAt: string | null;
};

export type MonthlyActivity = {
  month: string; // YYYY-MM
  purchases: number;
  salesAmount: number;
  newCustomers: number;
};

export type PlatformMetrics = {
  generatedAt: string;
  totals: {
    tenants: number;
    activeTenants: number;
    suspendedTenants: number;
    customers: number;
    purchases: number;
    salesAmount: number;
    pointsIssued: number;
    redemptions: number;
  };
  monthly: MonthlyActivity[];
  tenants: TenantActivity[];
};

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  return (await apiClient.get<PlatformMetrics>("/api/platform/metrics")).data;
}

/** CSV (separator ";" + UTF-8 BOM, opens correctly in Excel in Spanish) of the per-tenant report. */
export function buildTenantActivityCsv(tenants: TenantActivity[]): string {
  const escape = (value: string | number | null) => {
    const text = value === null ? "" : String(value);
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return /[;"\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const header = ["tenant", "code", "status", "users", "programs", "customers", "purchases",
    "sales_amount", "points_issued", "redemptions", "last_purchase_at"];
  const rows = tenants.map((t) => [t.name, t.code, t.active ? "active" : "suspended", t.users, t.programs,
    t.customers, t.purchases, Number(t.salesAmount).toFixed(2), Number(t.pointsIssued).toFixed(2),
    t.redemptions, t.lastPurchaseAt ?? ""].map(escape).join(";"));
  return "﻿" + [header.join(";"), ...rows].join("\r\n") + "\r\n";
}
