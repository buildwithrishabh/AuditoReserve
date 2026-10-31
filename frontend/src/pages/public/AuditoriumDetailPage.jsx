import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Users, MapPin, Clock, ChevronRight } from "lucide-react";
import { getSingleAuditorium } from "../../api/auditoriums";
import { useAuth } from "../../hooks/useAuth";
import { ImageFrame } from "../../components/auditoriums/AuditoriumCard";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { slideLeft, slideRight, staggerContainerFast, cardItem, fadeIn } from "../../lib/animations";

export function AuditoriumDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const {
    data: auditorium,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["auditorium", id],
    queryFn: () => getSingleAuditorium(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <FullPageState
        title="Loading Auditorium Details"
        message="Fetching auditorium inventory specifications..."
      />
    );
  }

  if (isError || !auditorium) {
    return (
      <ErrorState
        title="Could not load auditorium"
        onRetry={() => void refetch()}
      />
    );
  }

  const allImages = auditorium.images || [];
  const activeImage = allImages[activeImgIndex];

  return (
    <motion.section variants={fadeIn} initial="hidden" animate="visible">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
        <Link to="/" style={{ color: "var(--text-muted)" }}>Home</Link>
        <span>/</span>
        <Link to="/auditoriums" style={{ color: "var(--text-muted)" }}>Auditoriums</Link>
        <span>/</span>
        <span style={{ color: "var(--text)", fontWeight: 600 }}>{auditorium.name}</span>
      </nav>

      <div className="detail-grid">
        <motion.div
          className="gallery"
          variants={slideRight}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeImgIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ImageFrame src={activeImage} alt={auditorium.name} large />
            </motion.div>
          </AnimatePresence>

          {allImages.length > 1 && (
            <motion.div
              className="thumbnail-row"
              variants={staggerContainerFast}
              initial="hidden"
              animate="visible"
            >
              {allImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className="thumbnail-btn"
                  onClick={() => setActiveImgIndex(index)}
                  aria-label={`View photo ${index + 1}`}
                  aria-pressed={index === activeImgIndex}
                  style={{ border: "none", padding: 0, background: "none" }}
                >
                  <motion.img
                    src={image}
                    alt=""
                    className={index === activeImgIndex ? "active-thumb" : ""}
                    variants={cardItem}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                  />
                </button>
              ))}
            </motion.div>
          )}
        </motion.div>

        <motion.aside
          className="detail-panel panel"
          variants={slideLeft}
          initial="hidden"
          animate="visible"
        >
          <p className="eyebrow">Venue Profile</p>
          <h1>{auditorium.name}</h1>
          <p>{auditorium.description}</p>

          <div className="fact-list">
            <span>
              <Users size={18} style={{ color: "var(--primary)" }} aria-hidden="true" />
              <strong>{auditorium.capacity} seats</strong> capacity
            </span>
            <span>
              <MapPin size={18} style={{ color: "var(--primary)" }} aria-hidden="true" />
              Campus facility infrastructure
            </span>
            <span>
              <Clock size={18} style={{ color: "var(--primary)" }} aria-hidden="true" />
              <strong className="tabular-nums">₹{auditorium.basePrice}</strong> base price per hour
            </span>
          </div>

          <h3 style={{ marginTop: "16px", marginBottom: "8px" }}>Amenities</h3>
          <div className="amenities">
            {auditorium.amenities.map((amenity) => (
              <span key={amenity}>{amenity}</span>
            ))}
          </div>

          <div style={{ marginTop: "28px" }}>
            {user?.role === "student" ? (
              <Link
                className="button primary wide"
                to={`/bookings/new/${auditorium._id}`}
              >
                Request booking <ChevronRight size={18} />
              </Link>
            ) : user?.role === "admin" ? (
              <Link
                className="button primary wide"
                to={`/admin/auditoriums/${auditorium._id}/edit`}
              >
                Edit auditorium details
              </Link>
            ) : (
              <Link className="button primary wide" to="/login">
                Log in to request booking
              </Link>
            )}
          </div>

          <p className="note">
            Booking requests require administrator review. Availability conflicts
            are evaluated at the time of submission.
          </p>
        </motion.aside>
      </div>
    </motion.section>
  );
}

export default AuditoriumDetailPage;
