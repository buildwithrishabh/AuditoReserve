import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, ExternalLink, LayoutDashboard, LogOut, MapPin, Menu, Moon, Sun, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { pageTransition } from "../../lib/animations";
import { NotificationCenter } from "./NotificationCenter";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <header className="admin-mobile-bar">
        <Link to="/admin" className="brand admin-brand" style={{ border: "none", padding: 0, margin: 0 }}>
          <span className="brand-mark" aria-hidden="true">AR</span>
          <span>Admin</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
          <NotificationCenter />
          <button
            type="button"
            className="icon-button theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="mobile-menu-btn"
            type="button"
            aria-label={isMenuOpen ? "Close admin navigation" : "Open admin navigation"}
            aria-expanded={isMenuOpen}
            aria-controls="admin-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      <motion.aside
        className="sidebar"
        id="admin-navigation"
        animate={isMenuOpen ? "open" : "closed"}
        initial={false}
        variants={{
          closed: { x: "-100%", opacity: 0 },
          open: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <Link to="/admin" className="brand" style={{ padding: "4px 0" }}>
            <span className="brand-mark" aria-hidden="true">AR</span>
            <span>Admin</span>
          </Link>
          <button
            type="button"
            className="icon-button theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            title={isDark ? "Light theme" : "Dark theme"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <nav className="side-nav" aria-label="Admin side navigation">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : "")}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/auditoriums" className={({ isActive }) => (isActive ? "active" : "")}>
            <MapPin size={18} /> Auditoriums
          </NavLink>
          <NavLink to="/admin/bookings" className={({ isActive }) => (isActive ? "active" : "")}>
            <CalendarDays size={18} /> Bookings
          </NavLink>
          <Link to="/" style={{ color: "var(--text-subtle)", marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
            <ExternalLink size={16} /> View public site
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p>{user?.name}</p>
            <NotificationCenter />
          </div>
          <button
            className="button ghost wide danger-icon"
            type="button"
            onClick={handleLogout}
            style={{ gap: "10px" }}
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="admin-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <main className="admin-main">
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
    </div>
  );
}

export default AdminLayout;
