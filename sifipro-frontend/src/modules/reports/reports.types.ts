// Mirrors the DTOs of GET /api/reports/** (sifipro-backend, report package).
// BigDecimal values arrive as JSON numbers.

export type ReportGranularity = "DAY" | "MONTH";

export type ReportRange = {
  from: string; // yyyy-MM-dd, inclusive
  to: string; // yyyy-MM-dd, inclusive
};

export interface ReportSummary {
  programConfigId: number;
  programName: string;
  from: string | null;
  to: string | null;
  purchases: number;
  totalAmount: number;
  pointsIssued: number;
  redemptions: number;
  pointsRedeemed: number;
  purchasingCustomers: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  programRewards: number;
  programActiveRewards: number;
}

export interface ReportTimeSeriesPoint {
  period: string; // first day of the bucket, yyyy-MM-dd
  purchases: number;
  amount: number;
  pointsIssued: number;
  redemptions: number;
  pointsRedeemed: number;
}

export interface TopCustomerReportEntry {
  customerId: number;
  customerFullName: string;
  email: string;
  active: boolean;
  purchases: number;
  amount: number;
  pointsEarned: number;
  redemptions: number;
  pointsBalance: number;
}

export interface TopRewardReportEntry {
  rewardId: number;
  rewardName: string;
  redemptions: number;
  pointsRedeemed: number;
  stock: number;
}

export type TierName = "BRONZE" | "SILVER" | "GOLD";

export interface TierDistributionEntry {
  tier: TierName;
  customers: number;
  totalPoints: number;
}

export interface StockAlertEntry {
  id: number;
  name: string;
  stock: number;
  requiredPoints: number;
  status: "OUT_OF_STOCK" | "LOW_STOCK";
}

export interface RecentActivity {
  transactions: {
    id: number;
    customerFullName: string;
    amount: number;
    pointsEarned: number;
    transactionDate: string;
  }[];
  redemptions: {
    id: number;
    customerFullName: string;
    rewardName: string;
    pointsUsed: number;
    redemptionDate: string;
  }[];
}

export interface ReportsData {
  summary: ReportSummary;
  timeSeries: ReportTimeSeriesPoint[];
  topCustomers: TopCustomerReportEntry[];
  topRewards: TopRewardReportEntry[];
  tierDistribution: TierDistributionEntry[];
  stockAlerts: StockAlertEntry[];
}
