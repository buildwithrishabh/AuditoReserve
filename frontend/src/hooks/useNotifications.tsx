/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
  const fetchHistory = useCallback(async () => {
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
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiMarkAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
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
  }, [notifications]);

  // Fetch initial logs on login
  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      if (isAuthenticated) {
        void fetchHistory();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fetchHistory, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Remove VITE_API_URL '/api' suffix to get base socket domain
    const socketBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
      .replace(/\/api$/, "");

    const socket: Socket = io(socketBaseUrl, {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    // Handle incoming real-time notifications
    socket.on("notification", (newNotification: Notification) => {
      setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]); // keep latest 10
      setUnreadCount((c) => c + 1);

      // Trigger user-facing floating toast alert
      showToast(newNotification.message, "info");
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user, showToast]);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      fetchHistory,
    }),
    [
      deleteNotification,
      fetchHistory,
      isLoading,
      markAllAsRead,
      markAsRead,
      notifications,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
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
