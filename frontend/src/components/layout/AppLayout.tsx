import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { Footer } from "./Footer";
import { pageTransition } from "../../lib/animations";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About", to: "/#about" },
  { label: "Features", to: "/#features" },
  { label: "Contact", to: "/#contact" },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const target = document.getElementById(id);
    if (target) {
      window.setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }, [location.hash, location.pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">AR</span>
          <span className="brand-name">AuditoReserve</span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.label} to={item.to}>{item.label}</Link>
          ))}
          {user?.role === "student" && (
            <NavLink to="/bookings" className={({ isActive }) => isActive ? "active" : ""}>My bookings</NavLink>
          )}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? "active" : ""}>Admin Panel</NavLink>
          )}
        </nav>

        <div className="topbar-actions">
          {user ? (
            <>
              <Link to="/account" className="user-pill">
                <User size={14} />
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </Link>
              <button className="icon-button danger-icon" type="button" onClick={handleLogout} aria-label="Log out" title="Log out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link className="button primary" to="/login">Login</Link>
              <Link className="button ghost" to="/register">Sign up</Link>
            </>
          )}
        </div>

        <button className="mobile-menu-btn" type="button" aria-label="Toggle menu" onClick={() => setMenuOpen((o) => !o)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="mobile-dropdown open"
              initial={{ opacity: 0, y: -10, scaleY: 0.97 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -10, scaleY: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: "top" }}
            >
              <nav>
                {navItems.map((item) => (
                  <Link key={item.label} to={item.to} className="mobile-dropdown-link" onClick={() => setMenuOpen(false)}>{item.label}</Link>
                ))}
                {user?.role === "student" && (
                  <NavLink to="/bookings" className={({ isActive }) => `mobile-dropdown-link ${isActive ? "active" : ""}`} onClick={() => setMenuOpen(false)}>My bookings</NavLink>
                )}
                {user?.role === "admin" && (
                  <NavLink to="/admin" className={({ isActive }) => `mobile-dropdown-link ${isActive ? "active" : ""}`} onClick={() => setMenuOpen(false)}>Admin Panel</NavLink>
                )}
              </nav>

              <div className="mobile-dropdown-divider" />

              {user ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}
                >
                  <Link to="/account" className="mobile-dropdown-user" onClick={() => setMenuOpen(false)}>
                    <div className="mobile-dropdown-avatar">
                      <User size={18} />
                    </div>
                    <div>
                      <div className="mobile-dropdown-name">{user.name}</div>
                      <div className="mobile-dropdown-role">{user.role}</div>
                    </div>
                  </Link>
                  <button className="mobile-dropdown-logout" type="button" onClick={handleLogout}>
                    <LogOut size={18} />
                    Log out
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  className="mobile-dropdown-auth"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.08 } }}
                >
                  <Link className="button primary w-full" to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link className="button ghost w-full" to="/register" onClick={() => setMenuOpen(false)}>Sign up</Link>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-dropdown-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <main className="main-wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
export default AppLayout;
