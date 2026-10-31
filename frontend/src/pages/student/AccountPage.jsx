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
      style={{ maxWidth: "640px", margin: "0 auto" }}
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
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "var(--primary-light)",
              color: "var(--primary)",
              display: "grid",
              placeItems: "center",
              border: "1px solid var(--ring)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <User size={28} />
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>
              Full Name
            </span>
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>{user?.name || "Active Session"}</h2>
          </div>
        </div>

        <div className="account-detail-grid">
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              background: "var(--surface-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <Mail size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: 700, fontSize: "13px" }}>Email address</span>
            </div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>
              {user?.email}
            </p>
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
              background: "var(--surface-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <ShieldCheck size={16} style={{ color: "var(--primary)" }} />
              <span style={{ fontWeight: 700, fontSize: "13px" }}>Permission Role</span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <StatusBadge
                status={user?.role === "admin" ? "admin" : "student"}
                label={user?.role}
              />
            </div>
          </div>
        </div>

        <button
          className="button danger wide"
          type="button"
          onClick={handleLogout}
          style={{ marginTop: "8px", gap: "10px" }}
        >
          <LogOut size={16} /> Log out from session
        </button>
      </motion.div>
    </motion.section>
  );
}

export default AccountPage;
