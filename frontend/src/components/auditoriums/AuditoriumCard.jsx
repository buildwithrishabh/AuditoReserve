import { Link } from "react-router-dom";
import { Users } from "lucide-react";

export function ImageFrame({ src, alt, large }) {
  return (
    <div className={`image-frame ${large ? "image-frame--large" : ""}`}>
      {src ? (
        <img
          src={src}
          alt={alt || "Auditorium venue photo"}
          loading="lazy"
          decoding="async"
          className="image-frame-img"
        />
      ) : (
        <div className="image-frame-fallback">
          <span className="fallback-initials">
            {alt?.slice(0, 2).toUpperCase() || "AR"}
          </span>
          <span className="fallback-sub">AuditoReserve</span>
        </div>
      )}
    </div>
  );
}

export function AuditoriumCard({ auditorium, hideActions }) {
  return (
    <article className="card card--interactive auditorium-card">
      <div className="card-media-wrapper">
        <Link to={`/auditoriums/${auditorium._id}`} tabIndex={-1} aria-hidden="true">
          <ImageFrame src={auditorium.images?.[0]} alt={auditorium.name} />
        </Link>
        <span className="card-price-overlay tabular-nums">
          &#8377;{auditorium.basePrice} <em>/ hr</em>
        </span>
      </div>

      <div className="card-body">
        <div className="card-title-row">
          <h2 className="card-title">
            <Link to={`/auditoriums/${auditorium._id}`}>
              {auditorium.name}
            </Link>
          </h2>
        </div>

        <div className="card-meta-row">
          <span className="meta-capacity">
            <Users size={15} className="meta-icon" aria-hidden="true" />
            <strong className="tabular-nums">{auditorium.capacity}</strong> seats capacity
          </span>
        </div>

        <p className="card-description line-clamp-2">
          {auditorium.description || "University auditorium suitable for academic symposiums, guest lectures, and cultural events."}
        </p>

        {auditorium.amenities?.length > 0 && (
          <div className="card-amenities-row">
            {auditorium.amenities.slice(0, 3).map((amenity) => (
              <span key={amenity} className="amenity-chip">
                {amenity}
              </span>
            ))}
            {auditorium.amenities.length > 3 && (
              <span className="amenity-chip amenity-chip--more">
                +{auditorium.amenities.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {!hideActions && (
        <div className="card-actions-row">
          <Link className="button ghost sm" to={`/auditoriums/${auditorium._id}`}>
            View details
          </Link>
          <Link className="button primary sm" to={`/bookings/new/${auditorium._id}`}>
            Request booking
          </Link>
        </div>
      )}
    </article>
  );
}

export default AuditoriumCard;
