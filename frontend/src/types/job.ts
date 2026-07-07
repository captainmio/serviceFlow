export interface JobPayload {
  title: string;
  customerId: string;
  serviceId: string;
  hourlyRate: number;
}

export interface Job {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
}
