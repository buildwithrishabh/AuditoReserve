import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/useToast";
import { useNotifications } from "../../hooks/useNotifications";
import "./RefreshButton.css";

export function RefreshButton({
  variant = "icon", // "icon" | "button" | "sidebar" | "ghost"
  label = "Refresh",
  queryKey = null,
  showToastNotification = true,
  className = "",
  size = 18,
  style = {},
  title = "Refresh latest updates",
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const { fetchHistory } = useNotifications();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isRefreshing) return;

    setIsRefreshing(true);
    const startTime = Date.now();

    try {
      // Invalidate queries to trigger background refetch
      if (queryKey) {
        await queryClient.invalidateQueries({ queryKey, refetchType: "active" });
      } else {
        await queryClient.invalidateQueries({ refetchType: "active" });
      }

      // Also refresh notification status if notifications context is available
      if (fetchHistory) {
        try {
          await fetchHistory();
        } catch {
          // silently catch
        }
      }

      // Keep spinner active for at least 500ms for satisfying visual feedback
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }

      if (showToastNotification) {
        showToast("Refreshed! Latest updates loaded.", "success", 2500);
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      if (showToastNotification) {
        showToast("Failed to refresh updates. Please try again.", "error", 3000);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const spinClass = isRefreshing ? "animate-spin" : "";

  if (variant === "button" || variant === "ghost") {
    return (
      <motion.button
        type="button"
        className={`button ${variant === "ghost" ? "ghost" : "secondary"} refresh-btn ${className}`}
        onClick={handleRefresh}
        disabled={isRefreshing}
        whileTap={{ scale: 0.95 }}
        title={title}
        aria-label={label || title}
        style={{ gap: "8px", ...style }}
      >
        <RefreshCw size={size} className={spinClass} />
        <span>{isRefreshing ? "Refreshing..." : label}</span>
      </motion.button>
    );
  }

  if (variant === "sidebar") {
    return (
      <motion.button
        type="button"
        className={`sidebar-refresh-btn ${className}`}
        onClick={handleRefresh}
        disabled={isRefreshing}
        whileTap={{ scale: 0.95 }}
        title={title}
        aria-label={label || title}
        style={style}
      >
        <RefreshCw size={size} className={spinClass} />
        <span>{isRefreshing ? "Updating..." : label}</span>
      </motion.button>
    );
  }

  // Default "icon" variant
  return (
    <motion.button
      type="button"
      className={`icon-button refresh-icon-btn ${className}`}
      onClick={handleRefresh}
      disabled={isRefreshing}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      title={title}
      aria-label={title}
      style={style}
    >
      <RefreshCw size={size} className={spinClass} />
    </motion.button>
  );
}

export default RefreshButton;
