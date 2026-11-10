export interface CustomerResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  pointsBalance: number | string;
  active: boolean;
  /** RF-08 · the customer can sign in to the self-service portal. */
  portalEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface UpdateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export type CustomerFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};
