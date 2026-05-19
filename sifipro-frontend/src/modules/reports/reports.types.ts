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

export interface ReportsScopeSummary {
  tenantCustomers: number;
  tenantActiveCustomers: number;
  programRewards: number;
  programActiveRewards: number;
  programTransactions: number;
  programRedemptions: number;
  totalPointsIssuedInProgram: number;
  totalPointsRedeemedInProgram: number;
}

export interface TopCustomerResponse {
  customerId: number;
  customerFullName: string;
  email: string;
  pointsBalance: number | string;
  active: boolean;
  transactionsCount?: number;
  redemptionsCount?: number;
}

export interface TopRedeemedRewardResponse {
  rewardId: number;
  rewardName: string;
  totalRedemptions: number;
}

export interface ReportsData {
  summary: ReportsScopeSummary;
  topCustomers: TopCustomerResponse[];
  topRedeemedRewards: TopRedeemedRewardResponse[];
}
