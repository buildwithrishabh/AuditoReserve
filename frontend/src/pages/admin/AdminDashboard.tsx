import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getAllAuditoriums } from "../../api/auditoriums";
import { getAllBookings } from "../../api/bookings";
import { BookingRow } from "../../components/bookings/BookingRow";
import { SkeletonGrid } from "../../components/common/LoadingSkeleton";
import { EmptyState } from "../../components/common/ErrorState";
import { staggerContainerFast, cardItem, slideUp } from "../../lib/animations";

type MetricProps = {
  title: string;
  value: number;
  tone?: "accent" | "success";
};

function MetricCard({ title, value, tone }: MetricProps) {
  return (
    <motion.div
      className={`metric ${tone || ""}`}
      variants={cardItem}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <p>{title}</p>
      <motion.strong
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        {value}
      </motion.strong>
    </motion.div>
  );
}

export function AdminDashboard() {
  const { data: auditoriums = [], isLoading: isLoadingAuds } = useQuery({
    queryKey: ["auditoriums"],
    queryFn: getAllAuditoriums,
  });

  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: getAllBookings,
  });

  const pending = bookings.filter((b) => b.status === "pending");
  const confirmed = bookings.filter((b) => b.status === "confirmed");

  const isLoading = isLoadingAuds || isLoadingBookings;

  return (
    <section>
      <div className="page-header">
        <p className="eyebrow">Admin console</p>
        <h1>Dashboard</h1>
        <p>Review venue inventory stats and pending student requests.</p>
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
          <motion.div className="metric-grid" variants={staggerContainerFast}>
            <MetricCard title="Auditoriums" value={auditoriums.length} />
            <MetricCard title="Total bookings" value={bookings.length} />
            <MetricCard title="Pending requests" value={pending.length} tone="accent" />
            <MetricCard title="Confirmed" value={confirmed.length} tone="success" />
          </motion.div>

          <motion.div className="panel" variants={slideUp}>
            <div className="section-heading">
              <h2 style={{ fontSize: "18px", margin: "0" }}>Recent pending requests</h2>
              <Link to="/admin/bookings">View all requests</Link>
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
