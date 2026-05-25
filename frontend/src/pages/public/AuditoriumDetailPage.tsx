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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                <motion.img
                  key={image}
                  src={image}
                  alt=""
                  className={index === activeImgIndex ? "active-thumb" : ""}
                  onClick={() => setActiveImgIndex(index)}
                  variants={cardItem}
                  whileHover={{ scale: 1.05, borderColor: "var(--accent)" }}
                  whileTap={{ scale: 0.95 }}
                  style={{ cursor: "pointer" }}
                />
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
          <motion.p variants={fadeIn} className="eyebrow">Venue Profile</motion.p>
          <motion.h1 variants={slideLeft} style={{ fontSize: "28px", marginBottom: "14px" }}>
            {auditorium.name}
          </motion.h1>
          <motion.p variants={fadeIn}>{auditorium.description}</motion.p>
          
          <motion.div
            className="fact-list"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            <motion.span variants={cardItem}>
              <Users size={17} style={{ color: "var(--primary)" }} />{" "}
              {auditorium.capacity} seats capacity
            </motion.span>
            <motion.span variants={cardItem}>
              <MapPin size={17} style={{ color: "var(--primary)" }} /> Campus
              facility infrastructure
            </motion.span>
            <motion.span variants={cardItem}>
              <Clock size={17} style={{ color: "var(--primary)" }} /> ₹
              {auditorium.basePrice} base price per hour
            </motion.span>
          </motion.div>

          <motion.h3 variants={fadeIn} style={{ marginTop: "20px", marginBottom: "8px" }}>Amenities</motion.h3>
          <motion.div
            className="amenities"
            variants={staggerContainerFast}
            initial="hidden"
            animate="visible"
          >
            {auditorium.amenities.map((amenity) => (
              <motion.span key={amenity} variants={cardItem}>{amenity}</motion.span>
            ))}
          </motion.div>

          <motion.div variants={fadeIn} style={{ marginTop: "28px" }}>
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
          </motion.div>
          <motion.p variants={fadeIn} className="note">
            Booking requests require administrator review. availability conflicts
            are evaluated at the time of submission.
          </motion.p>
        </motion.aside>
      </div>
    </motion.section>
  );
}
export default AuditoriumDetailPage;
