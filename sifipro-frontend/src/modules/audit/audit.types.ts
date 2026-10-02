// Mirrors GET /api/audit/points-movements (sifipro-backend, audit package).

export type AuditMovementType = "EARN" | "REDEEM" | "ADJUSTMENT" | "EXPIRE";

export interface AuditMovementEntry {
  id: number;
  date: string;
  type: AuditMovementType;
  customerId: number;
  customerName: string;
  customerEmail: string;
  programConfigId: number;
  programName: string;
  points: number; // signed: positive adds, negative removes
  referenceType: string;
  referenceId: number | null;
  referenceLabel: string;
  registeredById: number | null;
  registeredByName: string | null;
  registeredByEmail: string | null;
  reason: string | null;
  description: string | null;
}

export interface AuditPage {
  content: AuditMovementEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type AuditFilters = {
  from: string;
  to: string;
  type: "" | AuditMovementType;
  customerId: string;
  userId: string;
};

// POST /api/customers/{id}/adjustments
export interface PointsAdjustmentRequest {
  programConfigId: number;
  points: number;
  reason: string;
}

export interface PointsAdjustmentResponse {
  movementId: number;
  customerId: number;
  programConfigId: number;
  programName: string;
  points: number;
  reason: string;
  pointsBalance: number;
  programBalance: number;
  createdBy: number;
  createdAt: string;
}
