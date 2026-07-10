import { apiClient } from "./api-client";
import type {
  ProjectApprovalDetail,
  ProjectApprovalLine,
  ProjectApprovalSummary,
  WorkLogLineStatus
} from "../types/project-approval";

export const fetchProjectApprovalsRequest = async (options: {
  search?: string;
  monthStart: string;
}): Promise<ProjectApprovalSummary[]> => {
  const params = new URLSearchParams({
    monthStart: options.monthStart
  });

  if (options.search) {
    params.set("search", options.search);
  }

  const { data } = await apiClient.get<ProjectApprovalSummary[]>(`/project-approvals?${params.toString()}`);
  return data;
};

export const fetchProjectApprovalDetailRequest = async (
  projectId: string,
  monthStart: string
): Promise<ProjectApprovalDetail> => {
  const params = new URLSearchParams({
    monthStart
  });
  const { data } = await apiClient.get<ProjectApprovalDetail>(`/project-approvals/${projectId}?${params.toString()}`);
  return data;
};

export const reviewProjectApprovalLineRequest = async (
  workLogId: string,
  payload: {
    status: WorkLogLineStatus;
    rejectionReason: string | null;
  }
): Promise<ProjectApprovalLine> => {
  const { data } = await apiClient.patch<ProjectApprovalLine>(
    `/project-approvals/work-logs/${workLogId}/review`,
    payload
  );
  return data;
};

export const finalizeProjectApprovalMonthRequest = async (
  projectId: string,
  monthStart: string
): Promise<ProjectApprovalDetail> => {
  const { data } = await apiClient.post<ProjectApprovalDetail>(`/project-approvals/${projectId}/finalize`, {
    monthStart
  });
  return data;
};
