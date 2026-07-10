import type { AuthUser } from "./auth";
import type { WorkLogMonthStatus } from "./work-log";

export type WorkLogLineStatus = "pending" | "approved" | "rejected";

export interface ProjectApprovalSummary {
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

export interface ProjectApprovalLine {
  id: string;
  workDate: string;
  weekStart: string;
  serviceName: string;
  member: AuthUser;
  hours: number;
  lineTotal: number;
  notes: string;
  reviewStatus: WorkLogLineStatus;
  reviewedBy: AuthUser | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface ProjectApprovalIncompleteMember {
  member: AuthUser;
  missingWeekStarts: string[];
}

export interface ProjectApprovalRevenueSummary {
  weekStart: string;
  weekEnd: string;
  totalRevenue: number;
}

export interface ProjectApprovalDetail {
  projectId: string;
  projectTitle: string;
  customerName: string;
  monthStart: string;
  monthStatus: WorkLogMonthStatus;
  reviewedBy: AuthUser | null;
  reviewedAt: string | null;
  workLogs: ProjectApprovalLine[];
  incompleteMembers: ProjectApprovalIncompleteMember[];
  readyMembers: AuthUser[];
  weeklyRevenue: ProjectApprovalRevenueSummary[];
  monthRevenue: number;
  projectRevenue: number;
  canFinalize: boolean;
}
