import type { AuthUser } from "./auth";

export interface NotificationItem {
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
  notifications: NotificationItem[];
  user: AuthUser;
}
