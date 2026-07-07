import { config } from "../config";
import type { Job, JobPayload } from "../types/job";
import { buildAuthHeaders, parseError } from "./api-client";

export const createJobRequest = async (token: string, payload: JobPayload): Promise<Job> => {
  const response = await fetch(`${config.apiBaseUrl}/jobs`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseError(response);
  }

  return (await response.json()) as Job;
};
