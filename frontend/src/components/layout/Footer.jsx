import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="global-footer">
      <div className="footer-inner">
        <div className="footer-copyright">
          <span>&copy; {new Date().getFullYear()} AuditoReserve</span>
          <span className="footer-dot">&middot;</span>
          <span>All rights reserved</span>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/auditoriums">Auditoriums</Link>
          <a href="/#about">About</a>
          <a href="/#contact">Contact</a>
        </nav>

        <div className="footer-badge">
          <span>Built with</span>
          <Heart size={13} className="footer-heart-icon" aria-hidden="true" />
          <span>for campus events</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
