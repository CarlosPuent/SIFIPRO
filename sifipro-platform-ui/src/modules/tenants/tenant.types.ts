export interface TenantResponse {
  id: number;
  name: string;
  code: string;
  active: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  code: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

/** RF-01 · editable data of a tenant; its code (= subdomain) never changes. */
export interface UpdateTenantRequest {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export type TenantFormValues = {
  name: string;
  code: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
};

// Matches Spring Data's Page<T> JSON shape (only the fields this app reads).
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
