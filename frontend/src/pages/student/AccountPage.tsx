import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { StatusBadge } from "../../components/common/StatusBadge";
import { User, Mail, ShieldCheck, LogOut } from "lucide-react";
import { staggerContainerFast, cardItem, slideUp } from "../../lib/animations";

export function AccountPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    showToast("Logged out successfully.", "info");
    navigate("/login");
  };

  return (
    <motion.section
      style={{ maxWidth: "680px", margin: "0 auto" }}
      variants={staggerContainerFast}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="page-header" variants={slideUp} style={{ textAlign: "center" }}>
        <p className="eyebrow">User profile</p>
        <h1>Account details</h1>
        <p>Information about the currently authenticated session.</p>
      </motion.div>

      <motion.div
        className="panel"
        variants={cardItem}
        style={{ display: "grid", gap: "24px", padding: "36px" }}
      >
        <motion.div variants={cardItem} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--primary-light)",
              display: "grid",
              placeItems: "center",
              border: "1px solid var(--border)",
            }}
          >
            <User size={28} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
              Full Name
            </span>
            <h2 style={{ margin: "0", fontSize: "20px" }}>{user?.name || "Active Session"}</h2>
          </div>
        </motion.div>

        <motion.div className="account-detail-grid" variants={staggerContainerFast}>
          <motion.div
            variants={cardItem}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              background: "var(--background)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Mail size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: "700", fontSize: "13px" }}>Email address</span>
            </div>
            <p style={{ margin: "0", fontSize: "14px", fontWeight: "500", color: "var(--text)" }}>
              {user?.email}
            </p>
          </motion.div>

          <motion.div
            variants={cardItem}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              background: "var(--background)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <ShieldCheck size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: "700", fontSize: "13px" }}>Permission Role</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <StatusBadge
                status={user?.role === "admin" ? "admin" : "student"}
                label={user?.role}
              />
            </div>
          </motion.div>
        </motion.div>

        <motion.button
          className="button danger"
          type="button"
          onClick={handleLogout}
          variants={cardItem}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          style={{ width: "100%", marginTop: "12px", gap: "10px" }}
        >
          <LogOut size={16} /> Log out from session
        </motion.button>
      </motion.div>
    </motion.section>
  );
}
export default AccountPage;
