import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Trash2, Calendar, CreditCard, AlertCircle, Info, Inbox, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../../hooks/useNotifications";
import type { Notification, NotificationType } from "../../types";

const getNotificationIconInfo = (type: NotificationType) => {
  switch (type) {
    case "BOOKING_PENDING":
      return {
        icon: <Calendar className="icon-orange" size={16} />,
        containerClass: "icon-container-pending"
      };
    case "BOOKING_APPROVED":
    case "BOOKING_CONFIRMED":
      return {
        icon: <Calendar className="icon-green" size={16} />,
        containerClass: "icon-container-success"
      };
    case "BOOKING_CANCELLED":
      return {
        icon: <AlertCircle className="icon-red" size={16} />,
        containerClass: "icon-container-danger"
      };
    case "PAYMENT_REQUEST":
      return {
        icon: <CreditCard className="icon-blue" size={16} />,
        containerClass: "icon-container-info"
      };
    default:
      return {
        icon: <Info className="icon-gray" size={16} />,
        containerClass: "icon-container-default"
      };
  }
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter notifications based on tab selection
  const filteredNotifications = activeTab === "all"
    ? notifications
    : notifications.filter((item) => !item.isRead);

  return (
    <div className="notification-center-container" ref={containerRef}>
      {/* Bell Trigger Icon */}
      <button
        className="icon-button notification-bell-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="bell-badge">
            <span className="bell-badge-ping" />
            <span className="bell-badge-count">{unreadCount > 9 ? "9+" : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-dropdown"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="notification-tabs">
              <button
                type="button"
                className={`notification-tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All
                <span className="notification-tab-badge">{notifications.length}</span>
              </button>
              <button
                type="button"
                className={`notification-tab-btn ${activeTab === "unread" ? "active" : ""}`}
                onClick={() => setActiveTab("unread")}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="notification-tab-badge">{unreadCount}</span>
                )}
              </button>
            </div>

            {/* List with layout animations */}
            <div className="notification-list custom-scrollbar">
              <AnimatePresence initial={false} mode="popLayout">
                {filteredNotifications.length === 0 ? (
                  <motion.div
                    key="empty-state"
                    className="notification-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="notification-empty-icon-wrapper">
                      <Inbox size={24} />
                    </div>
                    <p>{activeTab === "unread" ? "All caught up!" : "No notifications"}</p>
                    <span>
                      {activeTab === "unread"
                        ? "You don't have any unread notifications."
                        : "No new notifications at this time."}
                    </span>
                  </motion.div>
                ) : (
                  filteredNotifications.map((item: Notification) => {
                    const iconInfo = getNotificationIconInfo(item.type);
                    return (
                      <motion.div
                        key={item._id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -30, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 450, damping: 30 }}
                        className={`notification-item ${!item.isRead ? "unread" : ""}`}
                        onClick={() => !item.isRead && markAsRead(item._id)}
                      >
                        <div className={`notification-item-icon ${iconInfo.containerClass}`}>
                          {iconInfo.icon}
                        </div>
                        <div className="notification-item-content">
                          <h4>{item.title}</h4>
                          <p>{item.message}</p>
                          <div className="notification-meta-row">
                            <span className="notification-time-row">
                              <Clock size={11} />
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </span>
                            {!item.isRead && <span className="unread-dot" />}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="notification-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent markAsRead click trigger
                            deleteNotification(item._id);
                          }}
                          aria-label="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default NotificationCenter;
