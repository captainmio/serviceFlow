import type { ServiceStatus } from "../../entities/service-status.js";

export interface ServiceResponse {
  id: string;
  name: string;
  description: string;
  defaultHourlyRate: number;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}
