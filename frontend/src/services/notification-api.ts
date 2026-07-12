import { apiClient } from "./api-client";
import type { NotificationListResponse } from "../types/notification";

export const fetchNotificationsRequest = async (): Promise<NotificationListResponse> => {
  const { data } = await apiClient.get<NotificationListResponse>("/notifications");
  return data;
};

export const markAllNotificationsReadRequest = async (): Promise<NotificationListResponse> => {
  const { data } = await apiClient.patch<NotificationListResponse>("/notifications/read-all");
  return data;
};
