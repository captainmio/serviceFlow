export type ServiceStatus = "active" | "inactive";

export interface Service {
  id: string;
  name: string;
  description: string;
  defaultHourlyRate: number;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePayload {
  name: string;
  description: string;
  defaultHourlyRate: number;
  status: ServiceStatus;
}
