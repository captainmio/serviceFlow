import type { AuthResponse } from "../auth/auth.types.js";

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  unreadCount: number;
  notifications: NotificationResponse[];
  user: AuthResponse["user"];
}
