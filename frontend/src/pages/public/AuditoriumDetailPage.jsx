import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MapPin,
  Clock,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  ArrowRight,
  Building2,
} from "lucide-react";
import { getSingleAuditorium } from "../../api/auditoriums";
import { useAuth } from "../../hooks/useAuth";
import { ImageFrame } from "../../components/auditoriums/AuditoriumCard";
import { FullPageState } from "../../components/common/LoadingSkeleton";
import { ErrorState } from "../../components/common/ErrorState";
import { staggerContainerFast, fadeIn } from "../../lib/animations";

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

  const handlePrevImage = () => {
    setActiveImgIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImgIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.section variants={fadeIn} initial="hidden" animate="visible" className="auditorium-detail-page">
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" className="detail-breadcrumb">
        <Link to="/">Home</Link>
        <span className="crumb-sep">/</span>
        <Link to="/auditoriums">Auditoriums</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{auditorium.name}</span>
      </nav>

      <div className="detail-grid">
        {/* Left Column: Gallery & Venue Specs */}
        <div className="detail-main-col">
          {/* Main Gallery Display */}
          <div className="gallery-container">
            <div className="gallery-main-frame">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImgIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="gallery-image-wrapper"
                >
                  <ImageFrame src={activeImage} alt={auditorium.name} large />
                </motion.div>
              </AnimatePresence>

              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-nav-btn gallery-nav-btn--prev"
                    onClick={handlePrevImage}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="gallery-nav-btn gallery-nav-btn--next"
                    onClick={handleNextImage}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Row */}
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
                    className={`thumbnail-btn ${index === activeImgIndex ? "active" : ""}`}
                    onClick={() => setActiveImgIndex(index)}
                    aria-label={`View photo ${index + 1}`}
                    aria-pressed={index === activeImgIndex}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Venue Description & Specs */}
          <div className="card venue-info-card">
            <span className="eyebrow">
              <Building2 size={13} aria-hidden="true" />
              Venue Specifications
            </span>
            <h1 className="venue-title">{auditorium.name}</h1>
            <p className="venue-desc">
              {auditorium.description ||
                "This university facility features professional stage infrastructure, acoustic paneling, and audiovisual equipment suitable for department symposiums, student society presentations, and ceremonial convocations."}
            </p>

            <div className="venue-spec-grid">
              <div className="spec-card">
                <Users size={20} className="spec-icon" />
                <div>
                  <span className="spec-label">Capacity</span>
                  <strong className="spec-value tabular-nums">{auditorium.capacity} seats</strong>
                </div>
              </div>
              <div className="spec-card">
                <Clock size={20} className="spec-icon" />
                <div>
                  <span className="spec-label">Rate</span>
                  <strong className="spec-value tabular-nums">&#8377;{auditorium.basePrice} / hr</strong>
                </div>
              </div>
              <div className="spec-card">
                <MapPin size={20} className="spec-icon" />
                <div>
                  <span className="spec-label">Location</span>
                  <strong className="spec-value">Campus Main Complex</strong>
                </div>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="venue-amenities-section">
              <h3>Included Venue Amenities</h3>
              <div className="amenity-badges-grid">
                {auditorium.amenities?.map((amenity) => (
                  <div key={amenity} className="amenity-badge-item">
                    <Sparkles size={14} className="amenity-icon" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card */}
        <aside className="detail-sidebar-col">
          <div className="card sticky-booking-card">
            <div className="booking-card-price-header">
              <span className="price-label">Hourly Reservation Rate</span>
              <div className="price-callout">
                <strong className="price-number tabular-nums">&#8377;{auditorium.basePrice}</strong>
                <span className="price-period">per hour</span>
              </div>
            </div>

            <div className="booking-card-divider" />

            <div className="booking-checklist">
              <div className="check-item">
                <CalendarCheck size={16} className="check-icon" />
                <span>Conflict-free calendar slot verification</span>
              </div>
              <div className="check-item">
                <Clock size={16} className="check-icon" />
                <span>12-hour payment window upon approval</span>
              </div>
              <div className="check-item">
                <ShieldCheck size={16} className="check-icon" />
                <span>Verified university coordinator security clearance</span>
              </div>
            </div>

            <div className="booking-card-action">
              {user?.role === "student" ? (
                <Link
                  className="button primary lg wide"
                  to={`/bookings/new/${auditorium._id}`}
                >
                  Request this venue <ArrowRight size={18} />
                </Link>
              ) : user?.role === "admin" ? (
                <Link
                  className="button primary lg wide"
                  to={`/admin/auditoriums/${auditorium._id}/edit`}
                >
                  Edit auditorium details
                </Link>
              ) : (
                <Link className="button primary lg wide" to="/login">
                  Sign in to request booking
                </Link>
              )}
            </div>

            <p className="booking-card-note">
              No immediate charges. Booking requests are reviewed by facilities administration before payment is requested.
            </p>
          </div>
        </aside>
      </div>
    </motion.section>
  );
}

export default AuditoriumDetailPage;
