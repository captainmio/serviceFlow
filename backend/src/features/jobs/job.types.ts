import type { JobStatus } from "../../entities/job-status.js";
import type { UserRole } from "../../entities/user-role.js";

export interface JobAssignmentResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface JobServiceAssignmentResponse {
  id: string;
  serviceId: string;
  serviceName: string;
  hourlyRate: number;
  assignedTo: JobAssignmentResponse[];
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  customerId: string;
  customerName: string;
  projectManagerId: string | null;
  projectManager: JobAssignmentResponse | null;
  assignedTo: JobAssignmentResponse[];
  serviceAssignments: JobServiceAssignmentResponse[];
  status: JobStatus;
  startDate: string | null;
  dueDate: string | null;
  approvedBy: JobAssignmentResponse | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}
