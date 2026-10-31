import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Mail, ShieldCheck, LogOut, CalendarDays, ExternalLink } from "lucide-react";
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

  const getInitials = (name) => {
    if (!name) return "AR";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <motion.section
      className="account-page-container"
      variants={staggerContainerFast}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: "680px", margin: "0 auto" }}
    >
      <motion.div className="page-header" variants={slideUp} style={{ textAlign: "center" }}>
        <span className="eyebrow">Academic Identity</span>
        <h1>Account Profile</h1>
        <p>Authenticated session and university permissions.</p>
      </motion.div>

      <motion.div className="card" variants={cardItem} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* User Hero Row */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "var(--ink)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
              border: "2px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              flexShrink: 0,
            }}
          >
            {getInitials(user?.name)}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.35rem" }}>{user?.name || "Authenticated User"}</h2>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              University Faculty / Student Member
            </span>
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
              <span style={{ fontWeight: 700, fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-subtle)" }}>
                Email Address
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)" }}>
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
              <span style={{ fontWeight: 700, fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-subtle)" }}>
                Assigned Role
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <StatusBadge
                status={user?.role === "admin" ? "admin" : "student"}
                label={user?.role}
              />
            </div>
          </div>
        </div>

        {/* Quick Portal Navigation */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
          {user?.role === "student" && (
            <Link to="/bookings" className="button ghost wide" style={{ justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CalendarDays size={16} /> View my booking history
              </span>
              <ExternalLink size={15} />
            </Link>
          )}
          {user?.role === "admin" && (
            <Link to="/admin" className="button ghost wide" style={{ justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={16} /> Open administrative dashboard
              </span>
              <ExternalLink size={15} />
            </Link>
          )}
        </div>

        <button
          className="button danger wide"
          type="button"
          onClick={handleLogout}
          style={{ gap: "10px" }}
        >
          <LogOut size={16} /> End authenticated session
        </button>
      </motion.div>
    </motion.section>
  );
}

export default AccountPage;
