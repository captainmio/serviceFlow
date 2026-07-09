import type {
  WorkLog,
  WorkLogOption,
  WorkLogPayload,
  WorkLogPeriod,
  WorkLogMonthStatus,
  WorkLogWeekSubmission
} from "../types/work-log";
import { apiClient } from "./api-client";

export const fetchWorkLogOptionsRequest = async (): Promise<WorkLogOption[]> => {
  const { data } = await apiClient.get<WorkLogOption[]>("/work-logs/options");
  return data;
};

export const fetchWorkLogsRequest = async (options?: {
  projectId?: string;
  memberId?: string;
  monthStart?: string;
}): Promise<WorkLog[]> => {
  const params = new URLSearchParams();

  if (options?.projectId) {
    params.set("projectId", options.projectId);
  }

  if (options?.memberId) {
    params.set("memberId", options.memberId);
  }

  if (options?.monthStart) {
    params.set("monthStart", options.monthStart);
  }

  const queryString = params.toString();
  const { data } = await apiClient.get<WorkLog[]>(`/work-logs${queryString ? `?${queryString}` : ""}`);
  return data;
};

export const createWorkLogRequest = async (payload: WorkLogPayload): Promise<WorkLog> => {
  const { data } = await apiClient.post<WorkLog>("/work-logs", payload);
  return data;
};

export const updateWorkLogRequest = async (
  workLogId: string,
  payload: WorkLogPayload
): Promise<WorkLog> => {
  const { data } = await apiClient.put<WorkLog>(`/work-logs/${workLogId}`, payload);
  return data;
};

export const deleteWorkLogRequest = async (workLogId: string): Promise<void> => {
  await apiClient.delete(`/work-logs/${workLogId}`);
};

export const fetchWorkLogPeriodRequest = async (
  projectId: string,
  monthStart: string
): Promise<WorkLogPeriod> => {
  const params = new URLSearchParams({
    projectId,
    monthStart
  });
  const { data } = await apiClient.get<WorkLogPeriod>(`/work-logs/period?${params.toString()}`);
  return data;
};

export const reviewWorkLogPeriodRequest = async (payload: {
  projectId: string;
  monthStart: string;
  status: WorkLogMonthStatus;
  rejectionReason: string | null;
}): Promise<WorkLogPeriod> => {
  const { data } = await apiClient.patch<WorkLogPeriod>("/work-logs/period/review", payload);
  return data;
};

export const submitWorkLogWeekRequest = async (payload: {
  projectId: string;
  weekStart: string;
}): Promise<WorkLogWeekSubmission> => {
  const { data } = await apiClient.post<WorkLogWeekSubmission>("/work-logs/week-submissions", payload);
  return data;
};

export const unsubmitWorkLogWeekRequest = async (payload: {
  projectId: string;
  weekStart: string;
}): Promise<void> => {
  await apiClient.delete("/work-logs/week-submissions", {
    data: payload
  });
};
