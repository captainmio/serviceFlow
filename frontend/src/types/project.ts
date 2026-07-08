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

export interface ProjectPayload {
  customerId: string;
  title: string;
  description: string;
  assignedToIds: string[];
  status: ProjectStatus;
  startDate: string | null;
  dueDate: string | null;
  rejectionReason: string | null;
}

export interface Project extends ProjectPayload {
  id: string;
  customerName: string;
  assignedTo: AuthUser[];
  approvedBy: AuthUser | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
