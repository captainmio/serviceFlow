import type { Job, JobPayload } from "../types/job";
import { apiClient } from "./api-client";

export const createJobRequest = async (payload: JobPayload): Promise<Job> => {
  const { data } = await apiClient.post<Job>("/jobs", payload);
  return data;
};
