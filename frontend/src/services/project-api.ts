import type { Project, ProjectPayload } from "../types/project";
import { apiClient } from "./api-client";

export const fetchProjectsRequest = async (options?: {
  search?: string;
  status?: Project["status"] | "all";
  customerId?: string;
}): Promise<Project[]> => {
  const params = new URLSearchParams();

  if (options?.search) {
    params.set("search", options.search);
  }

  if (options?.status && options.status !== "all") {
    params.set("status", options.status);
  }

  if (options?.customerId) {
    params.set("customerId", options.customerId);
  }

  const queryString = params.toString();
  const { data } = await apiClient.get<Project[]>(`/projects${queryString ? `?${queryString}` : ""}`);
  return data;
};

export const fetchProjectRequest = async (projectId: string): Promise<Project> => {
  const { data } = await apiClient.get<Project>(`/projects/${projectId}`);
  return data;
};

export const createProjectRequest = async (payload: ProjectPayload): Promise<Project> => {
  const { data } = await apiClient.post<Project>("/projects", payload);
  return data;
};

export const updateProjectRequest = async (
  projectId: string,
  payload: ProjectPayload
): Promise<Project> => {
  const { data } = await apiClient.put<Project>(`/projects/${projectId}`, payload);
  return data;
};

export const cancelProjectRequest = async (projectId: string): Promise<Project> => {
  const { data } = await apiClient.patch<Project>(`/projects/${projectId}/cancel`);
  return data;
};
