export interface CustomerProfileTransactionEntry {
  id: number;
  programConfigId?: number;
  programName?: string | null;
  amount: number | string;
  pointsEarned?: number | string | null;
  awardedPoints?: number | string | null;
  transactionDate: string;
  createdAt?: string;
}

export interface CustomerProfileRedemptionEntry {
  id: number;
  programConfigId?: number;
  programName?: string | null;
  rewardName: string;
  pointsUsed: number | string;
  redemptionDate: string;
  createdAt?: string;
  rewardImageUrl?: string | null;
}

export interface CustomerProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  active: boolean;
  pointsBalance: number | string;
  createdAt: string;
  updatedAt: string;

  // Loyalty tier — may be provided by API or computed client-side
  tier?: string | null;
  tierName?: string | null;
  nextTier?: string | null;
  nextTierName?: string | null;
  pointsToNextTier?: number | string | null;
  nextTierThreshold?: number | string | null;
  tierProgressPercentage?: number | null;

  // Lifetime stats — various possible field names from API
  totalTransactions?: number | null;
  totalRedemptions?: number | null;
  lifetimePointsEarned?: number | string | null;
  lifetimePointsRedeemed?: number | string | null;
  totalPointsEarned?: number | string | null;
  totalPointsRedeemed?: number | string | null;

  // Recent activity — API may use either naming
  recentTransactions?: CustomerProfileTransactionEntry[] | null;
  recentRedemptions?: CustomerProfileRedemptionEntry[] | null;
  transactions?: CustomerProfileTransactionEntry[] | null;
  redemptions?: CustomerProfileRedemptionEntry[] | null;
}

export interface PointsHistoryEntry {
  date: string;
  pointsEarned?: number | string | null;
  pointsRedeemed?: number | string | null;
  balance?: number | string | null;
  cumulativeBalance?: number | string | null;
  netPoints?: number | string | null;
}
