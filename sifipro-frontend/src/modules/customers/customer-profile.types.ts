export interface CustomerProfileTransactionEntry {
  id: number;
  programConfigId?: number;
  programName?: string | null;
  amount: number;
  description?: string | null;
  pointsEarned: number;
  transactionDate: string;
}

export interface CustomerProfileRedemptionEntry {
  id: number;
  programConfigId?: number;
  programName?: string | null;
  rewardName: string;
  pointsUsed: number;
  redemptionDate: string;
  status?: string | null;
  rewardImageUrl?: string | null;
}

export interface CustomerProfileStats {
  totalTransactions: number;
  totalRedemptions: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
}

export interface CustomerProfileTierProgress {
  currentPoints: number;
  currentTier: string;
  nextTier: string | null;
  pointsForNextTier: number;
  pointsToNextTier: number;
  progressPercentage: number;
}

export interface CustomerProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  active: boolean;
  pointsBalance: number;
  memberSince: string;
  tier: string;
  tierProgress: CustomerProfileTierProgress;
  stats: CustomerProfileStats;
  recentTransactions: CustomerProfileTransactionEntry[];
  recentRedemptions: CustomerProfileRedemptionEntry[];
}

export type PointsHistoryEntry = {
  date: string;
  points: number;
  runningBalance: number;
  programName: string;
  type: "EARN" | "REDEEM";
};