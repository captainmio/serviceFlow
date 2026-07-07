import { config } from "../config";
import type { Job, JobPayload } from "../types/job";
import { fetchJson, jsonHeaders } from "./api-client";

export const createJobRequest = async (payload: JobPayload): Promise<Job> => {
  return fetchJson<Job>(`${config.apiBaseUrl}/jobs`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(payload)
  });
};
