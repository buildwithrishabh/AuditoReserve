import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import type { Auditorium } from "../../types";

export type ImageFrameProps = {
  src?: string;
  alt: string;
  large?: boolean;
};

export function ImageFrame({ src, alt, large }: ImageFrameProps) {
  return (
    <div className={`image-frame ${large ? "large" : ""}`}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <span style={{ fontSize: large ? "24px" : "14px" }}>
          {alt.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export type AuditoriumCardProps = {
  auditorium: Auditorium;
  hideActions?: boolean;
};

export function AuditoriumCard({ auditorium, hideActions }: AuditoriumCardProps) {
  return (
    <motion.article
      className="auditorium-card"
      whileHover={{
        y: -6,
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.4 }}>
        <ImageFrame src={auditorium.images?.[0]} alt={auditorium.name} />
      </motion.div>
      <div className="card-body">
        <div className="card-title-row">
          <h2>{auditorium.name}</h2>
          <span className="price">₹{auditorium.basePrice}/hr</span>
        </div>
        <div className="meta-row">
          <Users size={16} style={{ color: "var(--primary)" }} />
          <span>{auditorium.capacity} seats</span>
        </div>
        <p className="line-clamp-5">{auditorium.description}</p>
        <div className="amenities">
          {auditorium.amenities.slice(0, 3).map((amenity) => (
            <span key={amenity}>{amenity}</span>
          ))}
          {auditorium.amenities.length > 3 && (
            <span key="more" style={{ opacity: 0.85 }}>
              +{auditorium.amenities.length - 3} more
            </span>
          )}
        </div>
      </div>
      {!hideActions && (
        <motion.div
          className="card-actions"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Link className="button ghost" to={`/auditoriums/${auditorium._id}`}>
            View details
          </Link>
          <Link className="button primary" to={`/bookings/new/${auditorium._id}`}>
            Request booking
          </Link>
        </motion.div>
      )}
    </motion.article>
  );
}
export default AuditoriumCard;
