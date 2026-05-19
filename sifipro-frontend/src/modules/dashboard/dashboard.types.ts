export interface DashboardSummaryResponse {
  totalCustomers: number;
  totalActiveCustomers: number;
  totalRewards: number;
  totalActiveRewards: number;
  totalTransactions: number;
  totalRedemptions: number;
  totalPointsIssued: number | string;
  totalPointsRedeemed: number | string;
}

export interface DashboardScopeSummary {
  tenantCustomers: number;
  tenantActiveCustomers: number;
  programRewards: number;
  programActiveRewards: number;
  programTransactions: number;
  programRedemptions: number;
}

export interface TopCustomerResponse {
  customerId: number;
  customerFullName: string;
  email: string;
  pointsBalance: number | string;
  active: boolean;
}

export interface TopRedeemedRewardResponse {
  rewardId: number;
  rewardName: string;
  totalRedemptions: number;
}

export interface DashboardData {
  summary: DashboardSummaryResponse;
  topCustomers: TopCustomerResponse[];
  topRedeemedRewards: TopRedeemedRewardResponse[];
}

export interface DashboardTransactionResponse {
  id: number;
  programConfigId?: number;
  programName?: string | null;
  customerFullName: string;
  amount: number | string;
  transactionDate: string;
  pointsEarned: number | string;
  createdAt: string;
}

export interface DashboardRedemptionResponse {
  id: number;
  programConfigId: number;
  programName?: string | null;
  customerFullName: string;
  rewardName: string;
  redemptionDate: string;
  pointsUsed: number | string;
  createdAt: string;
}

export interface DashboardRewardResponse {
  id: number;
  programConfigId?: number;
  programName?: string | null;
  name: string;
  requiredPoints: number | string;
  stock: number;
  active: boolean;
}

export interface DashboardOperationalData {
  summary: DashboardScopeSummary;
  recentTransactions: DashboardTransactionResponse[];
  recentRedemptions: DashboardRedemptionResponse[];
  lowStockRewards: DashboardRewardResponse[];
}
