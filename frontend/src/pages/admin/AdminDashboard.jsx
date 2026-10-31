import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, CalendarDays, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { getAllAuditoriums } from "../../api/auditoriums";
import { getAllBookings } from "../../api/bookings";
import { useAuth } from "../../hooks/useAuth";
import { BookingRow } from "../../components/bookings/BookingRow";
import { SkeletonGrid } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/ErrorState";
import { RefreshButton } from "../../components/common/RefreshButton";
import { staggerContainerFast, cardItem, slideUp } from "../../lib/animations";

function MetricCard({ title, value, icon: Icon, tone, linkTo, subtitle }) {
  const content = (
    <motion.div
      className={`metric ${tone || ""}`}
      variants={cardItem}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {title}
        </p>
        {Icon && <Icon size={18} style={{ color: tone ? "inherit" : "var(--text-muted)" }} aria-hidden="true" />}
      </div>
      <strong className="tabular-nums">
        {value}
      </strong>
      {subtitle && (
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
          {subtitle}
        </span>
      )}
    </motion.div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: "none", display: "block" }}>
        {content}
      </Link>
    );
  }

  return content;
}

export function AdminDashboard() {
  const { user } = useAuth();

  const { data: auditoriums = [], isLoading: isLoadingAuds } = useQuery({
    queryKey: ["auditoriums"],
    queryFn: getAllAuditoriums,
  });

  const { data: bookingsResponse, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["admin-dashboard-bookings"],
    queryFn: () => getAllBookings({ limit: 100 }),
  });

  const bookings =
    bookingsResponse?.bookings ||
    (Array.isArray(bookingsResponse) ? bookingsResponse : []);
  const totalBookingsCount =
    bookingsResponse?.pagination?.totalItems ?? bookings.length;

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");

  const isLoading = isLoadingAuds || isLoadingBookings;

  // Proportions for the status distribution bar
  const totalStatusCount = pending.length + confirmed.length + cancelled.length || 1;
  const confirmedPct = Math.round((confirmed.length / totalStatusCount) * 100);
  const pendingPct = Math.round((pending.length / totalStatusCount) * 100);
  const cancelledPct = Math.round((cancelled.length / totalStatusCount) * 100);

  return (
    <section>
      <div className="dashboard-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <span className="eyebrow">Administrative Overview</span>
          <h1 style={{ margin: "2px 0 4px" }}>Welcome back, {user?.name || "Admin"}</h1>
          <p style={{ margin: 0 }}>Review venue inventory, monitor slot utilization, and action student requests.</p>
        </div>
        <div className="dashboard-header-actions">
          <RefreshButton label="Refresh metrics" queryKey={["admin-dashboard-bookings"]} title="Refresh dashboard data" />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gap: "20px", marginBottom: "32px", marginTop: "20px" }}>
          <SkeletonGrid />
        </div>
      ) : (
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
          style={{ marginTop: "24px" }}
        >
          {/* 4 KPI Metrics */}
          <div className="metric-grid">
            <MetricCard
              title="Auditoriums"
              value={auditoriums.length}
              icon={Building2}
              linkTo="/admin/auditoriums"
              subtitle="Active university venues"
            />
            <MetricCard
              title="Total bookings"
              value={totalBookingsCount}
              icon={CalendarDays}
              linkTo="/admin/bookings"
              subtitle="All-time recorded requests"
            />
            <MetricCard
              title="Pending review"
              value={pending.length}
              icon={Clock}
              tone={pending.length > 0 ? "accent" : undefined}
              linkTo="/admin/bookings"
              subtitle={pending.length > 0 ? "Action required" : "All caught up"}
            />
            <MetricCard
              title="Confirmed events"
              value={confirmed.length}
              icon={CheckCircle2}
              tone="success"
              linkTo="/admin/bookings"
              subtitle="Paid and verified"
            />
          </div>

          {/* Status Breakdown Proportion Bar */}
          {bookings.length > 0 && (
            <div className="card" style={{ padding: "16px 20px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.8125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>
                  Bookings Pipeline Distribution
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Sample of {bookings.length} recent records
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  borderRadius: "9999px",
                  overflow: "hidden",
                  display: "flex",
                  gap: "2px",
                  background: "var(--surface-2)",
                }}
              >
                <div style={{ width: `${confirmedPct}%`, background: "var(--status-confirmed-text)" }} title={`Confirmed: ${confirmedPct}%`} />
                <div style={{ width: `${pendingPct}%`, background: "var(--accent)" }} title={`Pending: ${pendingPct}%`} />
                <div style={{ width: `${cancelledPct}%`, background: "var(--status-cancelled-text)" }} title={`Cancelled: ${cancelledPct}%`} />
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--status-confirmed-text)" }} />
                  Confirmed ({confirmedPct}%)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)" }} />
                  Pending ({pendingPct}%)
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--status-cancelled-text)" }} />
                  Cancelled ({cancelledPct}%)
                </span>
              </div>
            </div>
          )}

          {/* Pending Requests Queue Card */}
          <motion.div className="card" variants={slideUp}>
            <div className="section-heading" style={{ marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Pending Approval Queue</h2>
                <p style={{ margin: "2px 0 0", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                  Student requests awaiting administrative approval.
                </p>
              </div>
              <Link to="/admin/bookings" className="button ghost sm" style={{ gap: "6px" }}>
                <span>View full queue</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <motion.div
              className="booking-list compact"
              variants={staggerContainerFast}
              initial="hidden"
              animate="visible"
            >
              {pending.slice(0, 5).map((booking) => (
                <motion.div key={booking._id} variants={cardItem}>
                  <BookingRow booking={booking} />
                </motion.div>
              ))}

              {pending.length === 0 && (
                <EmptyState
                  title="Queue is all caught up"
                  message="There are no pending requests requiring administrator approval at this time."
                />
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}

export default AdminDashboard;
