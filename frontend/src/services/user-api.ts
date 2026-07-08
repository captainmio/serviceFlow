import type { UserOption } from "../types/user";
import { apiClient } from "./api-client";

export const fetchAssignableUsersRequest = async (): Promise<UserOption[]> => {
  const { data } = await apiClient.get<UserOption[]>("/users");
  return data;
};
