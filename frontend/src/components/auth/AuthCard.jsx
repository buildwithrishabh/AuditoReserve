import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, Clock, FileCheck } from "lucide-react";
import { scaleIn, slideUp, fadeIn } from "../../lib/animations";

export function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-layout">
      {/* Left Brand Panel on Desktop */}
      <div className="auth-brand-panel">
        <div className="brand-panel-inner">
          <Link to="/" className="auth-brand-logo">
            <span className="brand-mark" aria-hidden="true">AR</span>
            <span className="brand-name">AuditoReserve</span>
          </Link>

          <div className="brand-panel-content">
            <span className="eyebrow eyebrow--ink">University Portal</span>
            <h2>Campus Facility & Venue Booking System</h2>
            <p>
              A dependable reservation platform for student organizations, faculty coordinators, and event committees.
            </p>

            <div className="auth-benefit-list">
              <div className="auth-benefit-item">
                <ShieldCheck size={18} className="benefit-icon" />
                <div>
                  <strong>University Domain Authentication</strong>
                  <span>Accountable booking records tied to academic profiles</span>
                </div>
              </div>
              <div className="auth-benefit-item">
                <Clock size={18} className="benefit-icon" />
                <div>
                  <strong>12-Hour Payment Window</strong>
                  <span>Guaranteed slot reservation upon administrative approval</span>
                </div>
              </div>
              <div className="auth-benefit-item">
                <FileCheck size={18} className="benefit-icon" />
                <div>
                  <strong>Instant Certified Receipts</strong>
                  <span>Server-generated official PDF transaction receipts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-panel-footer">
            <CheckCircle2 size={15} style={{ color: "var(--primary)" }} />
            <span>Encrypted Dual-Token Session &middot; Somaiya University Access</span>
          </div>
        </div>
      </div>

      {/* Right Form Card Container */}
      <div className="auth-form-wrapper">
        <motion.div
          className="auth-card"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile brand header */}
          <div className="mobile-auth-brand">
            <Link to="/" className="brand">
              <span className="brand-mark" aria-hidden="true">AR</span>
              <span className="brand-name">AuditoReserve</span>
            </Link>
          </div>

          <div className="auth-card-header">
            <motion.h1 variants={slideUp} className="auth-card-title">
              {title}
            </motion.h1>
            {subtitle && (
              <motion.p variants={fadeIn} className="auth-card-subtitle">
                {subtitle}
              </motion.p>
            )}
          </div>

          <motion.div variants={fadeIn} className="auth-card-body">
            {children}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default AuthCard;
