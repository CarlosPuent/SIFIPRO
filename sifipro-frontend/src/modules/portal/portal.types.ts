export type PublicTenant = {
  code: string;
  name: string;
  active: boolean;
};

export type PortalTierProgress = {
  currentTier: string;
  nextTier: string | null;
  currentPoints: number;
  pointsForNextTier: number | null;
  pointsToNextTier: number;
  progressPercentage: number;
};

export type PortalProgramBalance = {
  programId: number;
  programName: string;
  pointsBalance: number;
};

export type PortalProfile = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  memberSince: string;
  tenant: { code: string; name: string };
  pointsBalance: number;
  tier: string;
  tierProgress: PortalTierProgress;
  programs: PortalProgramBalance[];
};

export type PortalMovement = {
  id: number;
  date: string;
  type: "EARN" | "REDEEM" | "ADJUSTMENT" | "EXPIRE";
  programName: string;
  points: number;
  description: string | null;
};

export type PortalReward = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  programId: number;
  programName: string;
  requiredPoints: number;
  stock: number;
  programBalance: number;
  pointsMissing: number;
  available: boolean;
};

export type PortalAuthResponse = {
  accessToken: string;
  tokenType: string;
  customer: PortalProfile;
};
