import type { WorkLogMonthStatus } from "../../entities/work-log-month-status.js";
import type { AuthResponse } from "../auth/auth.types.js";

export interface WorkLogResponse {
  id: string;
  projectId: string;
  projectTitle: string;
  customerName: string;
  projectStartDate: string | null;
  projectDueDate: string | null;
  jobServiceId: string;
  serviceId: string;
  serviceName: string;
  member: AuthResponse["user"];
  workDate: string;
  weekStart: string;
  monthStart: string;
  hours: number;
  hourlyRate: number;
  lineTotal: number;
  notes: string;
  isWeekSubmitted: boolean;
  canEdit: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLogOptionResponse {
  jobServiceId: string;
  projectId: string;
  projectTitle: string;
  customerName: string;
  projectStartDate: string | null;
  projectDueDate: string | null;
  serviceId: string;
  serviceName: string;
  hourlyRate: number;
  projectStatus: string;
}

export interface WorkLogWeekSubmissionResponse {
  projectId: string;
  weekStart: string;
  monthStart: string;
  submittedAt: string;
}

export interface WorkLogPeriodResponse {
  id: string | null;
  projectId: string;
  projectTitle: string;
  monthStart: string;
  status: WorkLogMonthStatus;
  reviewedBy: AuthResponse["user"] | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  isLocked: boolean;
  submittedWeekStarts: string[];
}
