import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function Footer() {
  const { user } = useAuth();

  return (
    <footer className="global-footer">
      <div className="footer-top">
        <div className="footer-container">
          {/* Column 1: Brand & Mission */}
          <div className="footer-col footer-col--brand">
            <Link to="/" className="footer-brand">
              <span className="brand-mark" aria-hidden="true">AR</span>
              <span className="brand-name">AuditoReserve</span>
            </Link>
            <p className="footer-blurb">
              The official university auditorium and event space reservation portal. Streamlining venue discovery, slot scheduling, administrative approvals, and verifiable electronic receipts.
            </p>
          </div>

          {/* Column 2: Product */}
          <div className="footer-col">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-list">
              <li><Link to="/auditoriums">Browse Auditoriums</Link></li>
              <li><a href="/#how-it-works">How It Works</a></li>
              <li><a href="/#features">Platform Features</a></li>
              <li><a href="/#about">About System</a></li>
            </ul>
          </div>

          {/* Column 3: Account & Portals */}
          <div className="footer-col">
            <h4 className="footer-heading">Portals</h4>
            <ul className="footer-list">
              {user ? (
                <>
                  <li><Link to="/account">My Account</Link></li>
                  {user.role === "student" && <li><Link to="/bookings">My Bookings</Link></li>}
                  {user.role === "admin" && <li><Link to="/admin">Admin Console</Link></li>}
                </>
              ) : (
                <>
                  <li><Link to="/login">Student / Admin Sign In</Link></li>
                  <li><Link to="/register">Create Account</Link></li>
                  <li><Link to="/forgot-password">Reset Password</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Column 4: Contact & Facilities */}
          <div className="footer-col">
            <h4 className="footer-heading">Facilities Desk</h4>
            <ul className="footer-contact-list">
              <li>
                <Phone size={15} className="footer-icon" aria-hidden="true" />
                <a href="tel:+912267283000">+91 22 6728 3000</a>
              </li>
              <li>
                <Mail size={15} className="footer-icon" aria-hidden="true" />
                <a href="mailto:facilities@university.edu">facilities@university.edu</a>
              </li>
              <li>
                <MapPin size={15} className="footer-icon" aria-hidden="true" />
                <span>Campus Administration Block, Room 104</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-container footer-bottom-inner">
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} AuditoReserve &middot; University Facility Management System. All rights reserved.
          </p>
          <div className="footer-legal">
            <span>Verified University Domain Access</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
