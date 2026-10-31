import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { scaleIn, slideUp, fadeIn } from "../../lib/animations";

export function AuthCard({ title, subtitle, children }) {
  return (
    <section className="auth-page">
      <motion.div
        className="auth-card"
        variants={scaleIn}
        initial="hidden"
        animate="visible"
      >
        <Link to="/" className="brand centered-brand">
          <span className="brand-mark" aria-hidden="true">AR</span>
          <span>AuditoReserve</span>
        </Link>
        <motion.h1 variants={slideUp}>
          {title}
        </motion.h1>
        <motion.p variants={fadeIn}>
          {subtitle}
        </motion.p>
        <motion.div variants={fadeIn}>
          {children}
        </motion.div>
      </motion.div>
    </section>
  );
}

export default AuthCard;
