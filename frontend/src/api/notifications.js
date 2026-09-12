import { api } from "./client";

export async function getNotifications(page = 1, limit = 20) {
  const { data } = await api.get("/notifications", {
    params: { page, limit },
  });
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data.count;
}

export async function markAsRead(id) {
  const { data } = await api.patch(`/notifications/${id}`);
  return data;
}

export async function markAllAsRead() {
  const { data } = await api.patch("/notifications/read-all");
  return data;
}

export async function deleteNotification(id) {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
}
