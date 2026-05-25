import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "0 max(24px, calc((100vw - 1280px) / 2))",
      }}
    >
      <div className="footer-inner">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-muted)",
            fontSize: "13px",
            fontWeight: 600,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span>&copy; {new Date().getFullYear()} AuditoReserve</span>
          <span style={{ opacity: 0.4 }}>&middot;</span>
          <span>All rights reserved</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <Link
            to="/"
            style={{ color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Home
          </Link>
          <Link
            to="/auditoriums"
            style={{ color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            Auditoriums
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          <span>Built with</span>
          <Heart size={13} style={{ color: "var(--danger)" }} fill="var(--danger)" />
          <span>for campus events</span>
        </div>
      </div>
    </footer>
  );
}
