import {
  getRecentActivity,
  getReportSummary,
  getStockAlerts,
} from '../reports/reports.service';
import type { DashboardOperationalData } from './dashboard.types';

const LOW_STOCK_THRESHOLD = 5;
const RECENT_ITEMS = 5;

// The Dashboard reads aggregated, tenant-scoped figures from tenant-api's report
// endpoints (whole history, no date range) instead of downloading every customer,
// transaction and redemption and counting them in the browser. The results are
// mapped onto the Dashboard's existing view types, so its components are unchanged.
export async function fetchOperationalDashboardData(
  programConfigId: number,
): Promise<DashboardOperationalData> {
  const [summary, activity, stockAlerts] = await Promise.all([
    getReportSummary(programConfigId),
    getRecentActivity(programConfigId, RECENT_ITEMS),
    getStockAlerts(programConfigId, LOW_STOCK_THRESHOLD, RECENT_ITEMS),
  ]);

  return {
    summary: {
      tenantCustomers: summary.totalCustomers,
      tenantActiveCustomers: summary.activeCustomers,
      programRewards: summary.programRewards,
      programActiveRewards: summary.programActiveRewards,
      programTransactions: summary.purchases,
      programRedemptions: summary.redemptions,
    },
    recentTransactions: activity.transactions.map((transaction) => ({
      id: transaction.id,
      programConfigId,
      customerFullName: transaction.customerFullName,
      amount: transaction.amount,
      transactionDate: transaction.transactionDate,
      pointsEarned: transaction.pointsEarned,
      createdAt: transaction.transactionDate,
    })),
    recentRedemptions: activity.redemptions.map((redemption) => ({
      id: redemption.id,
      programConfigId,
      customerFullName: redemption.customerFullName,
      rewardName: redemption.rewardName,
      redemptionDate: redemption.redemptionDate,
      pointsUsed: redemption.pointsUsed,
      createdAt: redemption.redemptionDate,
    })),
    lowStockRewards: stockAlerts.map((reward) => ({
      id: reward.id,
      programConfigId,
      name: reward.name,
      requiredPoints: reward.requiredPoints,
      stock: reward.stock,
      active: true,
    })),
  };
}
