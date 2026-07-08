import type { UserOption } from "../types/user";
import type { TeamMember, TeamMemberPayload } from "../types/team-member";
import { apiClient } from "./api-client";

export const fetchAssignableUsersRequest = async (): Promise<UserOption[]> => {
  const { data } = await apiClient.get<UserOption[]>("/users/assignable");
  return data;
};

export const fetchTeamMembersRequest = async (options?: {
  search?: string;
  active?: "all" | "true" | "false";
  role?: "all" | "admin" | "manager" | "team_member";
}): Promise<TeamMember[]> => {
  const params = new URLSearchParams();

  if (options?.search) {
    params.set("search", options.search);
  }

  if (options?.active && options.active !== "all") {
    params.set("active", options.active);
  }

  if (options?.role && options.role !== "all") {
    params.set("role", options.role);
  }

  const queryString = params.toString();
  const { data } = await apiClient.get<TeamMember[]>(`/users${queryString ? `?${queryString}` : ""}`);
  return data;
};

export const fetchTeamMemberRequest = async (userUuid: string): Promise<TeamMember> => {
  const { data } = await apiClient.get<TeamMember>(`/users/${userUuid}`);
  return data;
};

export const createTeamMemberRequest = async (payload: TeamMemberPayload): Promise<TeamMember> => {
  const { data } = await apiClient.post<TeamMember>("/users", payload);
  return data;
};

export const updateTeamMemberRequest = async (
  userUuid: string,
  payload: TeamMemberPayload
): Promise<TeamMember> => {
  const { data } = await apiClient.put<TeamMember>(`/users/${userUuid}`, payload);
  return data;
};
