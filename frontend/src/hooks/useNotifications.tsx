import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification
} from "../api/notifications";
import type { Notification } from "../types";

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to fetch history & unread counts
  const fetchHistory = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await getNotifications(1, 10); // fetch top 10 for bell dropdown
      const count = await getUnreadCount();
      setNotifications(data.notifications);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiMarkAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const target = notifications.find((n) => n._id === id);
      await apiDeleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (target && !target.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  // Fetch initial logs on login
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // WebSocket Live Updates Setup
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Remove VITE_API_URL '/api' suffix to get base socket domain
    const socketBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
      .replace(/\/api$/, "");

    console.log(`[Socket] Connecting to server at ${socketBaseUrl}`);
    const socket: Socket = io(socketBaseUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected successfully with ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    // Handle incoming real-time notifications
    socket.on("notification", (newNotification: Notification) => {
      console.log("[Socket] Live notification received:", newNotification);
      setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]); // keep latest 10
      setUnreadCount((c) => c + 1);

      // Trigger user-facing floating toast alert
      showToast(newNotification.message, "info");
    });

    return () => {
      console.log("[Socket] Disconnecting socket client");
      socket.disconnect();
    };
  }, [isAuthenticated, user, showToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        fetchHistory,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used inside a NotificationProvider");
  }
  return context;
}
