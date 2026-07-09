import type { AuthUser } from "./auth";
import type { ProjectStatus } from "./project";

export type WorkLogMonthStatus = "pending" | "approved" | "rejected";

export interface WorkLogPayload {
  jobServiceId: string;
  workDate: string;
  hours: number;
  notes: string;
}

export interface WorkLogOption {
  jobServiceId: string;
  projectId: string;
  projectTitle: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  hourlyRate: number;
  projectStatus: ProjectStatus;
}

export interface WorkLog {
  id: string;
  projectId: string;
  projectTitle: string;
  customerName: string;
  jobServiceId: string;
  serviceId: string;
  serviceName: string;
  member: AuthUser;
  workDate: string;
  weekStart: string;
  monthStart: string;
  hours: number;
  hourlyRate: number;
  lineTotal: number;
  notes: string;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLogPeriod {
  id: string | null;
  projectId: string;
  projectTitle: string;
  monthStart: string;
  status: WorkLogMonthStatus;
  reviewedBy: AuthUser | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  isLocked: boolean;
}
