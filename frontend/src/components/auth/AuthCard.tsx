import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { scaleIn, slideUp, fadeIn } from "../../lib/animations";

export type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <section className="auth-page">
      <motion.div
        className="auth-card"
        variants={scaleIn}
        initial="hidden"
        animate="visible"
      >
        <Link to="/" className="brand centered-brand" style={{ display: "flex" }}>
          <span className="brand-mark">AR</span>
          <span>AuditoReserve</span>
        </Link>
        <motion.h1 variants={slideUp} style={{ fontSize: "24px", textAlign: "center", marginBottom: "8px" }}>
          {title}
        </motion.h1>
        <motion.p variants={fadeIn} style={{ textAlign: "center", marginBottom: "20px", fontSize: "14px" }}>
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
