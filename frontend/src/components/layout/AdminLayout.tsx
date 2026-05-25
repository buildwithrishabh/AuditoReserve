import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, LayoutDashboard, LogOut, MapPin, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import { pageTransition } from "../../lib/animations";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <header className="admin-mobile-bar">
        <Link to="/admin" className="brand admin-brand">
          <span className="brand-mark">AR</span>
          <span>Admin console</span>
        </Link>
        <button
          className="mobile-menu-button admin-menu-button"
          type="button"
          aria-label={isMenuOpen ? "Close admin navigation" : "Open admin navigation"}
          aria-expanded={isMenuOpen}
          aria-controls="admin-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <motion.aside
        className="sidebar"
        id="admin-navigation"
        animate={isMenuOpen ? "open" : "closed"}
        initial={false}
        variants={{
          closed: { x: "-100%", opacity: 0 },
          open: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
        }}
        style={{ display: "flex" }}
      >
        <Link to="/admin" className="brand admin-brand">
          <span className="brand-mark">AR</span>
          <span>Admin console</span>
        </Link>
        
        <nav className="side-nav">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? "active" : "")}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/auditoriums" className={({ isActive }) => (isActive ? "active" : "")}>
            <MapPin size={18} /> Auditoriums
          </NavLink>
          <NavLink to="/admin/bookings" className={({ isActive }) => (isActive ? "active" : "")}>
            <CalendarDays size={18} /> Bookings
          </NavLink>
        </nav>
        
        <motion.div
          className="sidebar-footer"
          initial={{ opacity: 0, y: 10 }}
          animate={isMenuOpen ? { opacity: 1, y: 0, transition: { delay: 0.15 } } : { opacity: 0, y: 10 }}
        >
          <p>{user?.name}</p>
          <button
            className="button ghost wide danger-icon"
            type="button"
            onClick={handleLogout}
            style={{ gap: "10px" }}
          >
            <LogOut size={16} /> Log out
          </button>
        </motion.div>
      </motion.aside>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="admin-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
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
