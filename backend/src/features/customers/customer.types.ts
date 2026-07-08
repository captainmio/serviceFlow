import type { CustomerStatus } from "../../entities/customer-status.js";

export interface CustomerResponse {
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
