import type { AuthUser } from "./auth";

export type ProjectStatus =
  | "draft"
  | "assigned"
  | "in_progress"
  | "submitted"
  | "approved"
  | "rejected"
  | "invoiced"
  | "paid"
  | "cancelled";

export interface ProjectServiceAssignmentPayload {
  serviceId: string;
  hourlyRate: number;
  assignedToIds: string[];
}

export interface ProjectPayload {
  customerId: string;
  projectManagerId: string;
  title: string;
  description: string;
  serviceAssignments: ProjectServiceAssignmentPayload[];
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  rejectionReason: string | null;
}

export interface ProjectServiceAssignment extends ProjectServiceAssignmentPayload {
  id: string;
  serviceName: string;
  assignedTo: AuthUser[];
}

export interface Project extends ProjectPayload {
  id: string;
  customerName: string;
  projectManager: AuthUser | null;
  assignedTo: AuthUser[];
  serviceAssignments: ProjectServiceAssignment[];
  approvedBy: AuthUser | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
