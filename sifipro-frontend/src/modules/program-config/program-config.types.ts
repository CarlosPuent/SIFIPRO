export type ProgramConfigResponse = {
  id: number;
  programName: string;
  pointsPerDollar: number | string;
  minimumPurchaseAmount: number | string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProgramConfigRequest = {
  programName: string;
  pointsPerDollar: number;
  minimumPurchaseAmount: number;
  active: boolean;
};

export type UpdateProgramConfigRequest = {
  programName: string;
  pointsPerDollar: number;
  minimumPurchaseAmount: number;
  active: boolean;
};
