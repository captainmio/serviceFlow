import type { WorkLogLineStatus } from "../../entities/work-log-line-status.js";
import type { WorkLogMonthStatus } from "../../entities/work-log-month-status.js";
import type { AuthResponse } from "../auth/auth.types.js";

export interface ProjectApprovalSummaryResponse {
  projectId: string;
  projectTitle: string;
  customerName: string;
  monthStart: string;
  readyMemberCount: number;
  incompleteMemberCount: number;
  submittedWeekCount: number;
  totalLoggedRevenue: number;
  lineItemCount: number;
  monthStatus: WorkLogMonthStatus;
  canFinalize: boolean;
}

export interface ProjectApprovalLineResponse {
  id: string;
  workDate: string;
  weekStart: string;
  serviceName: string;
  member: AuthResponse["user"];
  hours: number;
  lineTotal: number;
  notes: string;
  reviewStatus: WorkLogLineStatus;
  reviewedBy: AuthResponse["user"] | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface ProjectApprovalIncompleteMemberResponse {
  member: AuthResponse["user"];
  missingWeekStarts: string[];
}

export interface ProjectApprovalRevenueSummaryResponse {
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
}

export interface ProjectApprovalDetailResponse {
  projectId: string;
  projectTitle: string;
  customerName: string;
  monthStart: string;
  monthStatus: WorkLogMonthStatus;
  reviewedBy: AuthResponse["user"] | null;
  reviewedAt: string | null;
  workLogs: ProjectApprovalLineResponse[];
  incompleteMembers: ProjectApprovalIncompleteMemberResponse[];
  readyMembers: AuthResponse["user"][];
  weeklyRevenue: ProjectApprovalRevenueSummaryResponse[];
  monthRevenue: number;
  projectRevenue: number;
  canFinalize: boolean;
}
