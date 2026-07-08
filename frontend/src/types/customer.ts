export type CustomerStatus = "active" | "inactive";

export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
  hasJobs: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPayload {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: CustomerStatus;
}
