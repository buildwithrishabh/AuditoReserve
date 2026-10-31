import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { getAllAuditoriums } from "../../api/auditoriums";
import { getAllBookings } from "../../api/bookings";
import { BookingRow } from "../../components/bookings/BookingRow";
import { SkeletonGrid } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/ErrorState";
import { RefreshButton } from "../../components/common/RefreshButton";
import { staggerContainerFast, cardItem, slideUp } from "../../lib/animations";

function MetricCard({ title, value, icon: Icon, tone, linkTo }) {
  const content = (
    <motion.div
      className={`metric ${tone || ""}`}
      variants={cardItem}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <p style={{ margin: 0 }}>{title}</p>
        {Icon && <Icon size={18} style={{ color: "var(--text-muted)" }} aria-hidden="true" />}
      </div>
      <strong className="tabular-nums">
        {value}
      </strong>
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

  const isLoading = isLoadingAuds || isLoadingBookings;

  return (
    <section>
      <div className="dashboard-header-row">
        <div className="page-header" style={{ margin: 0 }}>
          <p className="eyebrow">Admin console</p>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: "4px 0 0" }}>Review venue inventory stats and pending student requests.</p>
        </div>
        <div className="dashboard-header-actions">
          <RefreshButton label="Refresh dashboard" title="Refresh dashboard data" />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "grid", gap: "20px", marginBottom: "32px" }}>
          <SkeletonGrid />
        </div>
      ) : (
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate="visible"
        >
          <div className="metric-grid">
            <MetricCard
              title="Auditoriums"
              value={auditoriums.length}
              icon={Building2}
              linkTo="/admin/auditoriums"
            />
            <MetricCard
              title="Total bookings"
              value={totalBookingsCount}
              icon={CalendarDays}
              linkTo="/admin/bookings"
            />
            <MetricCard
              title="Pending requests"
              value={pending.length}
              icon={Clock}
              tone="accent"
              linkTo="/admin/bookings"
            />
            <MetricCard
              title="Confirmed"
              value={confirmed.length}
              icon={CheckCircle2}
              tone="success"
              linkTo="/admin/bookings"
            />
          </div>

          <motion.div className="panel" variants={slideUp}>
            <div className="section-heading" style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Recent pending requests</h2>
              <Link to="/admin/bookings" style={{ fontSize: "13px", fontWeight: 600, color: "var(--primary)" }}>
                View all requests &rarr;
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
                  title="No pending requests"
                  message="New student bookings requests will appear here."
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
