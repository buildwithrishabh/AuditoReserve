import { api } from "./client";
import type { Notification } from "../types";

export type NotificationsResponse = {
  success: boolean;
  count: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  notifications: Notification[];
};

export async function getNotifications(page = 1, limit = 20) {
  const { data } = await api.get<NotificationsResponse>("/notifications", {
    params: { page, limit },
  });
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get<{ success: boolean; count: number }>("/notifications/unread-count");
  return data.count;
}

export async function markAsRead(id: string) {
  const { data } = await api.patch<{ success: boolean; notification: Notification }>(`/notifications/${id}`);
  return data;
}

export async function markAllAsRead() {
  const { data } = await api.patch<{ success: boolean; message: string }>("/notifications/read-all");
  return data;
}

export async function deleteNotification(id: string) {
  const { data } = await api.delete<{ success: boolean; message: string }>(`/notifications/${id}`);
  return data;
}
