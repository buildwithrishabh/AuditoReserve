import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export function ImageFrame({ src, alt, large }) {
  return (
    <div className={`image-frame ${large ? "large" : ""}`}>
      {src ? (
        <img src={src} alt={alt || "Auditorium venue"} loading="lazy" decoding="async" />
      ) : (
        <span>
          {alt?.slice(0, 2).toUpperCase() || "AR"}
        </span>
      )}
    </div>
  );
}

export function AuditoriumCard({ auditorium, hideActions }) {
  return (
    <motion.article
      className="auditorium-card"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/auditoriums/${auditorium._id}`} aria-label={`View details for ${auditorium.name}`}>
        <ImageFrame src={auditorium.images?.[0]} alt={auditorium.name} />
      </Link>
      <div className="card-body">
        <div className="card-title-row">
          <h2>
            <Link to={`/auditoriums/${auditorium._id}`} style={{ color: "var(--text)" }}>
              {auditorium.name}
            </Link>
          </h2>
          <span className="price tabular-nums">₹{auditorium.basePrice}/hr</span>
        </div>
        <div className="meta-row">
          <Users size={15} style={{ color: "var(--primary)" }} aria-hidden="true" />
          <span>{auditorium.capacity} seats</span>
        </div>
        <p className="line-clamp-5">{auditorium.description}</p>
        <div className="amenities">
          {auditorium.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity}>{amenity}</span>
          ))}
          {auditorium.amenities.length > 3 && (
            <span key="more">
              +{auditorium.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
      {!hideActions && (
        <div className="card-actions">
          <Link className="button ghost sm" to={`/auditoriums/${auditorium._id}`}>
            View details
          </Link>
          <Link className="button primary sm" to={`/bookings/new/${auditorium._id}`}>
            Request booking
          </Link>
        </div>
      )}
    </motion.article>
  );
}

export default AuditoriumCard;
