import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/useToast";
import { useNotifications } from "../../hooks/useNotifications";
import "./RefreshButton.css";

export function RefreshButton({
  label = "Refresh",
  queryKey = null,
  showToastNotification = true,
  className = "",
  size = 15,
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
      if (queryKey) {
        await queryClient.invalidateQueries({ queryKey, refetchType: "active" });
      } else {
        await queryClient.invalidateQueries({ refetchType: "active" });
      }

      if (fetchHistory) {
        try {
          await fetchHistory();
        } catch {
          // ignore
        }
      }

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
        showToast("Failed to refresh. Please try again.", "error", 3000);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <motion.button
      type="button"
      className={`refresh-btn ${isRefreshing ? "is-refreshing" : ""} ${className}`}
      onClick={handleRefresh}
      disabled={isRefreshing}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.15 }}
      title={title}
      aria-label={label || title}
      style={style}
    >
      <RefreshCw size={size} className={`refresh-icon ${isRefreshing ? "animate-spin" : ""}`} />
      <span>{isRefreshing ? "Refreshing..." : label}</span>
      <span className="refresh-live-dot" title="Live status" />
    </motion.button>
  );
}

export default RefreshButton;
