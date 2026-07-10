import { useState, useRef, useEffect } from "react";
import { Bell, CheckCheck, Trash2, Calendar, CreditCard, AlertCircle, Info, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../../hooks/useNotifications";
import type { Notification, NotificationType } from "../../types";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "BOOKING_PENDING":
      return <Calendar className="icon-orange" size={16} />;
    case "BOOKING_APPROVED":
    case "BOOKING_CONFIRMED":
      return <Calendar className="icon-green" size={16} />;
    case "BOOKING_CANCELLED":
      return <AlertCircle className="icon-red" size={16} />;
    case "PAYMENT_REQUEST":
      return <CreditCard className="icon-blue" size={16} />;
    default:
      return <Info className="icon-gray" size={16} />;
  }
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
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
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
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

            <div className="notification-list custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <Inbox size={32} className="text-muted" />
                  <p>You're all caught up!</p>
                  <span>No new notifications at this time.</span>
                </div>
              ) : (
                notifications.map((item: Notification) => (
                  <div
                    key={item._id}
                    className={`notification-item ${!item.isRead ? "unread" : ""}`}
                    onClick={() => !item.isRead && markAsRead(item._id)}
                  >
                    <div className="notification-item-icon">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="notification-item-content">
                      <h4>{item.title}</h4>
                      <p>{item.message}</p>
                      <span className="notification-time">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
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
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default NotificationCenter;
